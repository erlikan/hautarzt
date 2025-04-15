import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Define the structure of an Apify review item based on your example
interface ApifyReview {
    reviewId: string; // -> google_review_id (UNIQUE)
    text: string | null; // -> review_text
    stars: number | null; // -> review_rating
    reviewerNumberOfReviews: number | null; // -> author_reviews_count
    likesCount: number | null; // -> author_ratings_count
    reviewUrl: string | null; // -> review_link
    publishedAtDate: string | null; // -> review_datetime_utc (needs parsing)
    placeId: string; // -> praxis_google_place_id (for verification)
    // Add other fields if needed, otherwise they are ignored
}

// Define the structure of the webhook payload (simplified)
interface ApifyWebhookPayload {
    resource?: {
        defaultDatasetId?: string;
        actorRunId?: string; // Also available
    };
}

const APIFY_API_TOKEN = Deno.env.get('APIFY_API_TOKEN')
const APIFY_BASE_URL = 'https://api.apify.com/v2'

// Use service_role key for backend operations like inserting data
const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req: Request) => {
    console.log(`Webhook received: ${req.method} ${req.url}`)

    // 1. Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // 2. Basic Auth/Security Check (Optional but Recommended)
    // Add a check here if Apify webhooks support signing or basic auth
    // const authHeader = req.headers.get('Authorization')
    // if (!isValidAuth(authHeader)) {
    //   return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    // }

    if (!APIFY_API_TOKEN) {
        console.error('APIFY_API_TOKEN environment variable not set.')
        return new Response(JSON.stringify({ error: 'Internal server configuration error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    // 3. Extract details from webhook URL and payload
    const url = new URL(req.url)
    const praxisGooglePlaceIdFromUrl = url.searchParams.get('praxis_google_place_id')
    let payload: ApifyWebhookPayload

    try {
        payload = await req.json()
    } catch (error) {
        console.error('Failed to parse webhook payload:', error)
        return new Response(JSON.stringify({ error: 'Invalid webhook payload' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    const datasetId = payload?.resource?.defaultDatasetId
    const runId = payload?.resource?.actorRunId

    if (!praxisGooglePlaceIdFromUrl) {
        console.error('Missing praxis_google_place_id in webhook URL')
        return new Response(JSON.stringify({ error: 'Webhook URL misconfigured' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    if (!datasetId) {
        console.error('No datasetId found in webhook payload', payload)
        return new Response(JSON.stringify({ error: 'Invalid webhook payload structure' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    console.log(`Processing Apify run ${runId} dataset ${datasetId} for Praxis Google Place ID ${praxisGooglePlaceIdFromUrl}`)

    try {
        // 4. Fetch results from Apify Dataset
        const datasetUrl = `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`
        const apifyResponse = await fetch(datasetUrl)

        if (!apifyResponse.ok) {
            const errorBody = await apifyResponse.text()
            console.error(`Apify Dataset API error (${apifyResponse.status}): ${errorBody}`)
            throw new Error(`Failed to fetch dataset items. Status: ${apifyResponse.status}`)
        }

        const reviews: ApifyReview[] = await apifyResponse.json()
        console.log(`Fetched ${reviews.length} reviews from dataset ${datasetId}`)

        // Handle case where Apify run succeeded but found 0 reviews
        if (reviews.length === 0) {
            console.log(`No reviews found in dataset ${datasetId} for ${praxisGooglePlaceIdFromUrl}. Updating status. `)
            // Update praxis status to fetched (as the fetch *was* successful) and trigger analysis
            const { error: statusUpdateError } = await supabaseAdmin
                .from('praxis')
                .update({
                    apify_review_status: 'fetched',
                    analysis_status: 'pending'
                })
                .eq('google_place_id', praxisGooglePlaceIdFromUrl)

            if (statusUpdateError) {
                console.error(`Failed to update praxis status for ${praxisGooglePlaceIdFromUrl} after fetching 0 reviews:`, statusUpdateError)
                // Even if status update fails, report success for the webhook itself
            }

            return new Response(JSON.stringify({ success: true, message: 'No new reviews found in dataset.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // 5. Prepare data for Supabase insertion
        const reviewsToInsert = reviews
            // REMOVE filter for missing reviewId, as we use Delete-then-Insert
            // .filter(review => review.reviewId && review.reviewId.trim() !== '')
            .map(review => ({
                praxis_google_place_id: praxisGooglePlaceIdFromUrl,
                // google_review_id might be null now, which is acceptable with Delete-then-Insert
                google_review_id: review.reviewId,
                review_text: review.text,
                review_rating: review.stars,
                author_reviews_count: review.reviewerNumberOfReviews,
                author_ratings_count: review.likesCount,
                review_link: review.reviewUrl,
                review_datetime_utc: review.publishedAtDate ? new Date(review.publishedAtDate).toISOString() : null,
            }))

        if (reviewsToInsert.length === 0) {
            if (reviews.length > 0) {
                console.warn(`All ${reviews.length} fetched reviews were filtered out. Reasons: missing 'reviewId' or invalid/missing 'publishedAtDate'.`)
            } else {
                console.log('No reviews fetched or all had invalid data.')
            }
            return new Response(JSON.stringify({ success: true, message: 'No matching reviews to insert.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        console.log(`Attempting to delete existing reviews and insert/upsert ${reviewsToInsert.length} new reviews for Praxis Google Place ID ${praxisGooglePlaceIdFromUrl}...`)

        // 6a. Delete existing reviews for this praxis first
        console.log(`Deleting existing reviews for ${praxisGooglePlaceIdFromUrl}...`)
        const { error: deleteError } = await supabaseAdmin
            .from('review')
            .delete()
            .eq('praxis_google_place_id', praxisGooglePlaceIdFromUrl)

        if (deleteError) {
            // Log the error, but potentially proceed with insert? Or fail? 
            // Let's fail for now, as we want a clean slate.
            console.error(`Failed to delete existing reviews for ${praxisGooglePlaceIdFromUrl}:`, deleteError)
            // Set status to failed before throwing
            await supabaseAdmin.from('praxis').update({ apify_review_status: 'fetch_failed' }).eq('google_place_id', praxisGooglePlaceIdFromUrl)
            throw new Error(`Failed to delete existing reviews: ${deleteError.message}`)
        }
        console.log(`Deletion successful (or no existing reviews found) for ${praxisGooglePlaceIdFromUrl}.`)

        // 6b. Insert the new reviews (Upsert is no longer strictly necessary, but harmless)
        const { data: upsertData, error: upsertError } = await supabaseAdmin
            .from('review')
            .insert(reviewsToInsert) // Changed from upsert to insert
            // .upsert(reviewsToInsert, {
            //     onConflict: 'google_review_id',
            //     ignoreDuplicates: false, // `insert` doesn't need this
            // })
            .select('id')

        if (upsertError) {
            console.error('Supabase insert error:', upsertError)
            // Log potential bigint issue
            if (upsertError.message.includes('invalid input syntax for type bigint')) {
                console.error('Potential issue with praxis_id conversion. Check if it is a valid integer.')
            }
            // Set status to failed before throwing
            await supabaseAdmin.from('praxis').update({ apify_review_status: 'fetch_failed' }).eq('google_place_id', praxisGooglePlaceIdFromUrl)
            throw new Error(`Failed to save reviews: ${upsertError.message}`)
        }

        const insertedCount = upsertData?.length || 0
        console.log(`Successfully inserted ${insertedCount} reviews for Praxis Google Place ID ${praxisGooglePlaceIdFromUrl}.`)

        // 7. Update praxis status: set apify_review_status to 'fetched' and analysis_status to 'pending'
        console.log(`Updating praxis status for ${praxisGooglePlaceIdFromUrl} to fetched and pending analysis...`)
        const { error: statusUpdateError } = await supabaseAdmin
            .from('praxis')
            .update({
                apify_review_status: 'fetched',
                analysis_status: 'pending'
            })
            .eq('google_place_id', praxisGooglePlaceIdFromUrl)

        if (statusUpdateError) {
            // Log the error but don't fail the whole webhook process just because status update failed
            console.error(`Failed to update praxis status for ${praxisGooglePlaceIdFromUrl}:`, statusUpdateError)
        }

        return new Response(JSON.stringify({ success: true, insertedCount: insertedCount }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error(`Error processing webhook for Praxis Google Place ID ${praxisGooglePlaceIdFromUrl}:`, error)
        // Attempt to update status to failed if error happened after identifying the praxis ID
        if (praxisGooglePlaceIdFromUrl) {
            try {
                await supabaseAdmin.from('praxis').update({ apify_review_status: 'fetch_failed' }).eq('google_place_id', praxisGooglePlaceIdFromUrl)
                console.log(`Set apify_review_status to fetch_failed for ${praxisGooglePlaceIdFromUrl}`)
            } catch (statusError) {
                console.error(`Failed to update praxis status to fetch_failed for ${praxisGooglePlaceIdFromUrl}:`, statusError)
            }
        }
        const errorMessage = error instanceof Error ? error.message : 'Failed to process Apify webhook'
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
}) 