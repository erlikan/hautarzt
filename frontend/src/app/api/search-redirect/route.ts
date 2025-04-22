import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GERMAN_ZIP_REGEX, MAX_QUERY_LENGTH } from '@/lib/constants'; // Assume constants defined

// Function to generate the target URL
function getPraxisSearchUrl(slug: string): string {
    // Construct the URL relative to the base URL
    return `/hautarzt/${slug}`;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    // --- Input Validation ---
    if (!query || query.length === 0) {
        // Redirect to homepage if query is empty
        return NextResponse.redirect(new URL('/', request.url));
    }
    if (query.length > MAX_QUERY_LENGTH) { // Prevent overly long queries
        return NextResponse.json({ error: 'Suchanfrage zu lang.' }, { status: 400 });
    }
    // Basic sanitization (consider more robust library if complex threats anticipated)
    const sanitizedQuery = query.replace(/[^a-zA-Z0-9äöüÄÖÜß\s\-\(\)]/g, ''); // Allow letters, numbers, spaces, parens, hyphen
    if (sanitizedQuery.length === 0) {
        return NextResponse.redirect(new URL('/', request.url));
    }
    // --- End Validation ---

    // --- Initialize Supabase Client ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[Search Redirect API] Supabase URL or Anon Key missing.");
        // Fallback to general search page on server config error
        return NextResponse.redirect(new URL(`/suche?q=${encodeURIComponent(sanitizedQuery)}`, request.url));
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    // --- End Client Init ---

    try {
        let potentialMatches: { city: string | null; city_slug: string | null; }[] = [];
        let isPostalCodeSearch = false;

        // --- Check if query is a Postal Code ---
        if (GERMAN_ZIP_REGEX.test(sanitizedQuery)) {
            isPostalCodeSearch = true;
            const { data, error } = await supabase
                .from('praxis')
                .select('city, city_slug')
                .eq('postal_code', sanitizedQuery)
                .limit(1); // Only need one matching city/slug for the PLZ

            if (error) throw error;
            potentialMatches = data || [];

            // If PLZ found, redirect immediately to the first city found for that PLZ
            if (potentialMatches.length > 0 && potentialMatches[0].city_slug) {
                const targetUrl = getPraxisSearchUrl(potentialMatches[0].city_slug);
                return NextResponse.redirect(new URL(targetUrl, request.url));
            }
        }

        // --- If not a valid PLZ or PLZ not found, treat as City search ---
        if (!isPostalCodeSearch) {
            // Use textSearch for potentially better partial/fuzzy matching on normalized city names
            // Construct the query string carefully for textSearch
            const tsQuery = sanitizedQuery.split(/\s+/).join(' & '); // Prepare for phrase search
            const { data, error } = await supabase
                .rpc('search_distinct_cities_by_prefix', {
                    prefix: sanitizedQuery,
                    query_limit: 6
                })

            if (error) {
                // Check for specific function missing error
                if (error.code === '42883') { // Function does not exist
                    console.error("[Search Redirect API] RPC function 'search_distinct_cities_by_prefix' not found. Falling back to general search.");
                } else {
                    throw error; // Throw other DB errors
                }
            } else {
                potentialMatches = data || [];
            }
        }

        // --- Process Results ---

        // Deduplicate based on city_slug (case-insensitive check just in case)
        const uniqueOptions = potentialMatches.reduce((acc, match) => {
            if (match.city_slug && !acc.some(opt => opt.slug.toLowerCase() === match.city_slug?.toLowerCase())) {
                acc.push({ name: match.city || match.city_slug, slug: match.city_slug });
            }
            return acc;
        }, [] as { name: string; slug: string }[]);


        if (uniqueOptions.length === 1) {
            // Scenario A: Exact or single match -> Redirect
            const targetUrl = getPraxisSearchUrl(uniqueOptions[0].slug);
            return NextResponse.redirect(new URL(targetUrl, request.url));
        }

        if (uniqueOptions.length > 1) {
            // Scenario B: Multiple matches -> Return JSON for disambiguation
            return NextResponse.json({
                type: "disambiguation",
                query: sanitizedQuery,
                options: uniqueOptions
            }, { status: 200 });
        }

        // Scenario C: No matches -> Return specific JSON type
        return NextResponse.json({
            type: "no_match",
            query: sanitizedQuery
        }, { status: 200 });

    } catch (error: any) {
        console.error("[Search Redirect API] Error:", error);
        // Fallback to general search page on error
        const fallbackQuery = sanitizedQuery || query || ''; // Use sanitized if available
        return NextResponse.json({ error: 'Internal server error during redirect lookup.', details: error.message }, { status: 500 });
    }
}

// Required for POST, PUT, PATCH, DELETE, but useful for GET too for edge runtime
export const runtime = 'edge'; 