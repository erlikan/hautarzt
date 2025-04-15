import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Use service_role key for backend operations
const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Function to invoke the trigger function (avoids duplicating trigger logic)
// We need to use the service role key here potentially if RLS prevents anon/user key from invoking functions
// Or ensure the function invoke permissions allow the calling role.
// Using admin client for simplicity for now.
const triggerReviewScrape = async (googlePlaceId: string) => {
    const triggerUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/trigger-apify-review-scrape`
    console.log(`Invoking trigger function for: ${googlePlaceId}`)
    try {
        const response = await fetch(triggerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Use service role key for invocation
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                ...corsHeaders // Include CORS headers if needed, though likely not for server-to-server
            },
            body: JSON.stringify({ google_place_id: googlePlaceId })
        })

        const result = await response.json()

        if (!response.ok) {
            console.error(`Error invoking trigger function for ${googlePlaceId}: Status ${response.status}`, result)
            return { success: false, error: result.error || `Status ${response.status}` }
        } else {
            console.log(`Successfully invoked trigger for ${googlePlaceId}. Run ID: ${result.runId}`)
            return { success: true, runId: result.runId }
        }
    } catch (error) {
        console.error(`Network or other error invoking trigger function for ${googlePlaceId}:`, error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown invocation error' }
    }
}

serve(async (req) => {
    // 1. Handle CORS (though likely not needed for cron)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    console.log('Starting batch review fetch job...')

    const BATCH_SIZE = parseInt(Deno.env.get('APIFY_FETCH_BATCH_SIZE') || '5', 10);

    try {
        // 2. Find practices needing review fetch
        console.log(`Fetching up to ${BATCH_SIZE} practices needing review fetch...`)
        const { data: practicesToFetch, error: selectError } = await supabaseAdmin
            .from('praxis')
            .select('google_place_id') // Only need the ID
            .or('apify_review_status.is.null,apify_review_status.eq.needs_fetch,apify_review_status.eq.fetch_failed') // Fetch null, needs_fetch, or failed ones (for retry)
            // Optional: Add criteria like WHERE updated_at < now() - interval '1 day' to avoid retrying failed ones too quickly
            .limit(BATCH_SIZE)

        if (selectError) {
            console.error('Error fetching practices to process:', selectError)
            throw new Error(`Database query failed: ${selectError.message}`)
        }

        if (!practicesToFetch || practicesToFetch.length === 0) {
            console.log('No practices found needing review fetch.')
            return new Response(JSON.stringify({ success: true, message: 'No practices to fetch' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        console.log(`Found ${practicesToFetch.length} practices to process.`)
        const placeIds = practicesToFetch.map(p => p.google_place_id)

        // 3. Immediately mark them as 'fetching' to prevent reprocessing
        console.log(`Marking ${placeIds.length} practices as 'fetching'...`)
        const { error: updateError } = await supabaseAdmin
            .from('praxis')
            .update({ apify_review_status: 'fetching' })
            .in('google_place_id', placeIds)

        if (updateError) {
            // If update fails, log it but proceed to trigger for any successfully marked (though this shouldn't happen ideally)
            console.error('Error marking practices as fetching:', updateError)
            // Depending on requirements, might want to stop here
        }

        // 4. Trigger the scrape for each practice
        let triggeredCount = 0;
        let failedCount = 0;
        for (const placeId of placeIds) {
            const triggerResult = await triggerReviewScrape(placeId)
            if (triggerResult.success) {
                triggeredCount++;
            } else {
                failedCount++;
                // If trigger fails, update status back to indicate failure
                console.warn(`Failed to trigger Apify run for ${placeId}. Error: ${triggerResult.error}. Setting status to fetch_failed.`)
                try {
                    await supabaseAdmin
                        .from('praxis')
                        .update({ apify_review_status: 'fetch_failed' })
                        .eq('google_place_id', placeId);
                } catch (statusUpdateError) {
                    console.error(`Error updating status to fetch_failed for ${placeId} after trigger failure:`, statusUpdateError)
                }
            }
            // Optional slight delay between triggers if needed, but likely unnecessary
            // await new Promise(resolve => setTimeout(resolve, 100)); 
        }

        console.log(`Batch job finished. Triggered: ${triggeredCount}, Failed triggers: ${failedCount}`)

        return new Response(JSON.stringify({ success: true, triggered: triggeredCount, failed: failedCount }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Error in batch review fetch job:', error)
        const errorMessage = error instanceof Error ? error.message : 'Batch job failed'
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
}) 