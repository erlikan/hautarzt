import { NextResponse, type NextRequest } from 'next/server';

// Use Edge runtime for API route - often faster for simple proxies
export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    const homeUrl = new URL('/', request.url); // Base URL for error redirects

    if (!query) {
        // Redirect to homepage if query is missing
        return NextResponse.redirect(homeUrl.toString(), 307);
    }

    // Construct the Supabase function URL
    // IMPORTANT: Use an environment variable for the base URL in production!
    const supabaseProjectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
    const supabaseFuncBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL; // Use the dedicated functions URL env var

    // Check if environment variables are set
    if (!supabaseFuncBaseUrl || !supabaseProjectRef) { // Check both
        console.error("API Proxy Error: Supabase project ref or functions URL is not set in environment variables.");
        homeUrl.searchParams.set('error', 'config_error');
        return NextResponse.redirect(homeUrl.toString(), 307);
    }

    const supabaseFunctionUrl = `${supabaseFuncBaseUrl}/search-redirect?q=${encodeURIComponent(query)}`;

    try {
        // Call the actual Supabase function
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const headers: HeadersInit = {};
        if (anonKey) {
            headers['Authorization'] = `Bearer ${anonKey}`;
        }

        const response = await fetch(supabaseFunctionUrl, {
            method: 'GET',
            headers: headers,
            redirect: 'manual' // IMPORTANT: Prevent fetch from following the redirect automatically
        });

        // Forward the redirect response from the Supabase function
        if (response.status >= 300 && response.status < 400) { // Check for any redirect status
            const location = response.headers.get('Location');
            if (location) {
                // Location from Supabase func should be absolute
                return NextResponse.redirect(location, response.status); // Forward Location header directly
            }
        }

        // If Supabase function didn't redirect or errored unexpectedly,
        // redirect home with an error
        console.error(`Supabase search-redirect did not return a redirect. Status: ${response.status}`);
        let upstreamError = 'redirect_failed';
        try {
            const errorJson = await response.json();
            upstreamError = errorJson.error || upstreamError;
        } catch (_) { /* ignore parsing error */ }
        homeUrl.searchParams.set('error', upstreamError);
        return NextResponse.redirect(homeUrl.toString(), 307);

    } catch (error) {
        console.error("Error proxying to Supabase search-redirect:", error);
        homeUrl.searchParams.set('error', 'server_error');
        return NextResponse.redirect(homeUrl.toString(), 307);
    }
} 