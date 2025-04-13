// frontend/src/app/api/praxis-search/route.ts
import { NextResponse, type NextRequest } from 'next/server';
// Removed unused createClient import from @supabase/supabase-js for proxy

// Use Edge runtime for API route
export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    // --- Check Environment Variables ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseFuncBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseFuncBaseUrl) {
        console.error("API Proxy Error: Missing Supabase environment variables.");
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // --- Construct Supabase Function URL with Forwarded Params ---
    const forwardedParams = new URLSearchParams(searchParams.toString());
    const supabaseFunctionUrl = `${supabaseFuncBaseUrl}/praxis-search?${forwardedParams.toString()}`;

    try {
        // --- Call the actual Supabase function ---
        const response = await fetch(supabaseFunctionUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
            },
        });

        // --- Handle Response --- 
        const data = await response.json(); // Always try to parse JSON

        if (!response.ok) {
            // Log the error from Supabase function if possible
            console.error(`Supabase praxis-search function error (${response.status}):`, data?.error || 'Unknown upstream error');
            // Forward a generic or specific error
            return NextResponse.json({ error: data?.error || `Upstream function failed with status ${response.status}` }, { status: response.status });
        }

        // If successful, forward the data
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("Error proxying to Supabase praxis-search:", error);
        return NextResponse.json({ error: "Internal server error while proxying" }, { status: 500 });
    }
} 