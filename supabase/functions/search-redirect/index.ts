import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { createSlug } from '../_shared/slugify.ts'; // Assuming slugify is here
import { checkRateLimit } from '../_shared/rateLimiter.ts'; // Import rate limiter
import type { ServeHandlerInfo } from "https://deno.land/std@0.177.0/http/server.ts";

// Regular expression to check for a 5-digit German postal code
const GERMAN_ZIP_REGEX = /^\d{5}$/;
// Regular expression for allowed characters (Unicode letters, numbers, space, hyphen, dot)
const ALLOWED_CHARS_REGEX = /^[\p{L}\p{N}\s\-.]+$/u;
const MAX_QUERY_LENGTH = 100; // Max allowed query length

Deno.serve(async (req: Request, connInfo: ServeHandlerInfo) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // --- Rate Limiting Check --- 
    const allowed = await checkRateLimit(req, connInfo);
    if (!allowed) {
        return new Response(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    // --- End Rate Limiting Check ---

    // --- Get Frontend Base URL --- (Keep this check)
    const FRONTEND_BASE_URL = Deno.env.get("HAUTARZT_FRONTEND_BASE_URL");
    if (!FRONTEND_BASE_URL) {
        console.error("Critical: HAUTARZT_FRONTEND_BASE_URL environment variable is not set.");
        return new Response(JSON.stringify({ error: "Server configuration error: Frontend URL missing." }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- Get Query Parameter ---
    const url = new URL(req.url);
    const query = url.searchParams.get('q')?.trim();
    const baseFrontendUrl = new URL('/', FRONTEND_BASE_URL); // Use URL object

    // --- Input Validation --- 
    // 1. Check if query exists
    if (!query) {
        return new Response(null, { status: 307, headers: { ...corsHeaders, 'Location': baseFrontendUrl.toString() } });
    }

    // 2. Check length
    if (query.length > MAX_QUERY_LENGTH) {
        console.warn(`Redirector: Query too long (${query.length} chars). Query: ${query.substring(0, 50)}...`);
        const redirectUrl = new URL(baseFrontendUrl);
        redirectUrl.searchParams.set('error', 'query_too_long');
        return new Response(null, { status: 307, headers: { ...corsHeaders, 'Location': redirectUrl.toString() } });
    }

    // 3. Check allowed characters
    // Note: \p{L} includes letters with accents/umlauts, \p{N} includes numbers.
    if (!ALLOWED_CHARS_REGEX.test(query)) {
        console.warn(`Redirector: Query contains invalid characters. Query: ${query}`);
        const redirectUrl = new URL(baseFrontendUrl);
        redirectUrl.searchParams.set('error', 'invalid_chars');
        return new Response(null, { status: 307, headers: { ...corsHeaders, 'Location': redirectUrl.toString() } });
    }
    // --- End Input Validation --- 

    // --- Determine Destination URL ---
    let destinationPath = '/'; // Store path part first
    let destinationParams = new URLSearchParams(); // Store query params separately
    let errorParam = '';

    try {
        // --- Check if it's a Zip Code ---
        if (GERMAN_ZIP_REGEX.test(query)) {
            const postalCode = query;
            // Need DB client to find corresponding city slug
            const SUPABASE_URL = Deno.env.get("HAUTARZT_SUPABASE_URL");
            const SUPABASE_ANON_KEY = Deno.env.get("HAUTARZT_SUPABASE_ANON_KEY");

            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                console.error("Redirector: Missing Supabase Env Vars");
                throw new Error("Server configuration error");
            }
            const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // Query for the city_slug associated with this postal code
            // Ensure destructuring includes `error: dbError`
            const { data: praxisData, error: dbError } = await supabase
                .from('praxis')
                .select('city_slug') // Select the pre-computed slug
                .eq('postal_code', postalCode)
                .limit(1)
                .maybeSingle(); // Expect 0 or 1 result

            // Check the error object returned from the query
            if (dbError) {
                console.error(`Redirector: DB error fetching slug for PLZ ${postalCode}:`, dbError);
                errorParam = 'db_error';
                destinationPath = '/'; // Fallback to home
            } else if (praxisData && praxisData.city_slug) {
                // Found city slug, redirect to city page with PLZ filter
                destinationPath = `/hautarzt/${praxisData.city_slug}`;
                destinationParams.set('plz', postalCode); // Set PLZ query param
            } else {
                // PLZ not found in DB - Redirect home with error
                errorParam = 'plz_not_found';
                destinationPath = '/'; // Redirect to homepage
            }

        } else {
            // --- Assume it's a City Name --- 
            const generatedSlug = createSlug(query);
            if (generatedSlug && generatedSlug !== 'stadt') { // Check if slug is meaningful
                destinationPath = `/hautarzt/${generatedSlug}`;
            } else {
                // Could not generate a useful slug from the query - Redirect home with error
                errorParam = 'invalid_query';
                destinationPath = '/'; // Redirect to homepage
            }
        }

    } catch (err) {
        console.error("Error in search-redirect function:", err);
        errorParam = 'server_error';
        destinationPath = '/'; // Fallback to home path
    }

    // --- Perform Redirect ---
    // Construct final URL object using base, path, and params
    const finalRedirectUrl = new URL(destinationPath, FRONTEND_BASE_URL);
    // Append search params from destinationParams
    destinationParams.forEach((value, key) => {
        finalRedirectUrl.searchParams.append(key, value);
    });
    // Append error param if exists
    if (errorParam) {
        finalRedirectUrl.searchParams.set('error', errorParam);
    }

    return new Response(null, {
        status: 307, // Temporary Redirect
        headers: { ...corsHeaders, 'Location': finalRedirectUrl.toString() },
    });
}); 