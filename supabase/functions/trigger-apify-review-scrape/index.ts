import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const APIFY_API_TOKEN = Deno.env.get('APIFY_API_TOKEN')
// IMPORTANT: Replace with your actual Actor ID or Name
const APIFY_ACTOR_ID = Deno.env.get('APIFY_ACTOR_ID') || 'compass/google-maps-reviews-scraper'
const APIFY_BASE_URL = 'https://api.apify.com/v2'

serve(async (req: Request) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (!APIFY_API_TOKEN) {
        console.error('APIFY_API_TOKEN environment variable not set.')
        return new Response(JSON.stringify({ error: 'Internal server configuration error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    let google_place_id: string | null = null

    try {
        const body = await req.json()
        google_place_id = body.google_place_id
        if (!google_place_id) {
            throw new Error('Missing google_place_id in request body')
        }
    } catch (error) {
        console.error('Failed to parse request body:', error)
        const errorMessage = error instanceof Error ? error.message : 'Invalid request body. Expected { "google_place_id": "..." }'
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    try {
        // Create Supabase client with user's auth context
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Fetch the location_link from the praxis table
        const { data: praxisData, error: praxisError } = await supabaseClient
            .from('praxis')
            .select('google_place_id, location_link')
            .eq('google_place_id', google_place_id)
            .single()

        if (praxisError) {
            console.error('Supabase praxis query error:', praxisError)
            throw new Error(`Failed to fetch praxis data: ${praxisError.message}`)
        }
        if (!praxisData || !praxisData.location_link) {
            return new Response(JSON.stringify({ error: `Praxis with google_place_id ${google_place_id} not found or missing location_link` }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const locationLink = praxisData.location_link
        const praxisGooglePlaceId = praxisData.google_place_id

        // 2. Construct Apify Actor input payload (without webhooks)
        const actorInput = {
            language: 'de',
            maxReviews: 25,
            personalData: false,
            reviewsOrigin: 'google',
            startUrls: [
                {
                    url: locationLink,
                },
            ],
            reviewsSort: 'newest',
        }

        // Define the webhook configuration separately
        const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-apify-webhook?praxis_google_place_id=${praxisGooglePlaceId}`
        const webhooksConfig = [
            {
                "eventTypes": ["ACTOR.RUN.SUCCEEDED"],
                "requestUrl": webhookUrl,
                "payloadTemplate": `{ "resource": {{resource}} }`
            }
        ]

        // Stringify and Base64 encode the webhook config
        const encodedWebhooks = btoa(JSON.stringify(webhooksConfig))

        // 3. Call Apify API to start the run, adding webhooks as a URL parameter
        const apifyUrl = `${APIFY_BASE_URL}/acts/${APIFY_ACTOR_ID}/runs?token=${APIFY_API_TOKEN}&webhooks=${encodedWebhooks}`
        console.log(`Starting Apify run for ${locationLink} (Praxis Google Place ID: ${praxisGooglePlaceId}) with webhook URL parameter.`)
        // Log the body being sent to ensure webhooks is not included
        console.log('Apify request body:', JSON.stringify(actorInput))

        const apifyResponse = await fetch(apifyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(actorInput),
        })

        if (!apifyResponse.ok) {
            const errorBody = await apifyResponse.text()
            console.error(`Apify API error (${apifyResponse.status}): ${errorBody}`)
            throw new Error(`Failed to start Apify actor run. Status: ${apifyResponse.status}`)
        }

        const apifyResult = await apifyResponse.json()
        const runId = apifyResult.data?.id

        console.log(`Apify run started successfully. Run ID: ${runId}, Place ID: ${google_place_id}, Praxis Google Place ID: ${praxisGooglePlaceId}`)

        // Optional: Update praxis table with runId and status here if needed
        // Consider adding columns like `apify_last_run_id`, `apify_last_run_status`, `apify_last_run_triggered_at`

        return new Response(JSON.stringify({ success: true, runId: runId, google_place_id: google_place_id, praxis_google_place_id: praxisGooglePlaceId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Error triggering Apify run:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to trigger Apify review scrape'
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
}) 