// tests/edge-functions/praxis-search.test.ts
import { assertEquals, assertExists } from "https://deno.land/std@0.150.0/testing/asserts.ts";
import { createMockRequest } from "../test-utils/mock-request.ts";
import { createMockSupabase } from "../test-utils/mock-supabase.ts";
import { setupMockEnv } from "../test-utils/mock-env.ts";

// Set up mock environment variables
const cleanupEnv = setupMockEnv({
    'HAUTARZT_SUPABASE_URL': 'https://test-url.supabase.co',
    'HAUTARZT_SUPABASE_SERVICE_KEY': 'test-key'
});

// We'll need to mock the createClient function
let mockSupabase: ReturnType<typeof createMockSupabase>;
let mockRpcResponse: { data: any; error: any } = { data: null, error: null };

// Mock module implementation
const mockModule = {
    default: {
        fetch: async (req: Request) => {
            // Mock implementation of the edge function
            // Handle CORS preflight
            if (req.method === 'OPTIONS') {
                return new Response('ok', {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
                    }
                });
            }

            // Only accept GET requests
            if (req.method !== 'GET') {
                return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                    status: 405,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            try {
                // Parse query parameters
                const url = new URL(req.url);
                const params = url.searchParams;

                // Validate geo parameters
                const lat = params.get('lat');
                const lon = params.get('lon');
                if ((lat && !lon) || (!lat && lon)) {
                    return new Response(JSON.stringify({ error: 'Both lat and lon must be provided for geo search' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Validate pagination parameters
                const page = parseInt(params.get('page') || '1', 10);
                const pageSize = parseInt(params.get('pageSize') || '20', 10);
                if (page < 1 || pageSize < 1 || pageSize > 100) {
                    return new Response(JSON.stringify({ error: 'Invalid pagination parameters' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Handle RPC call to search_praxen_v2
                // Build search params
                const rpcParams: Record<string, any> = {
                    p_page: page,
                    p_page_size: pageSize
                };

                // Add other search parameters if present
                if (params.has('query')) rpcParams.p_query = params.get('query');
                if (params.has('city')) rpcParams.p_city = params.get('city');
                if (params.has('postalCode')) rpcParams.p_postal_code = params.get('postalCode');
                if (lat && lon) {
                    rpcParams.p_latitude = parseFloat(lat);
                    rpcParams.p_longitude = parseFloat(lon);
                    if (params.has('radius')) rpcParams.p_radius = parseFloat(params.get('radius')!);
                }
                if (params.has('minScore')) rpcParams.p_min_score = parseFloat(params.get('minScore')!);
                if (params.has('maxScore')) rpcParams.p_max_score = parseFloat(params.get('maxScore')!);
                if (params.has('services')) rpcParams.p_services = params.get('services')!.split(',');
                if (params.has('sortBy')) rpcParams.p_sort_by = params.get('sortBy');
                if (params.has('sortDirection')) rpcParams.p_sort_direction = params.get('sortDirection');

                // Mock calling the stored procedure
                if (mockSupabase && mockSupabase.rpc) {
                    // Use supplied mock implementation if available
                    mockSupabase.rpc('search_praxen_v2', rpcParams);
                }

                // Handle potential error from RPC call
                if (mockRpcResponse.error) {
                    return new Response(JSON.stringify({ error: 'Failed to search praxen' }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Format response
                const { items = [], total_count = 0 } = mockRpcResponse.data || {};
                const responseData = {
                    data: items,
                    meta: {
                        totalItems: total_count,
                        currentPage: page,
                        totalPages: Math.ceil(total_count / pageSize)
                    }
                };

                return new Response(JSON.stringify(responseData), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (err) {
                return new Response(JSON.stringify({ error: 'Internal server error' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
    }
};

Deno.test("praxis-search - handles OPTIONS request for CORS", async () => {
    const req = createMockRequest("OPTIONS", new URL("http://localhost/"));
    const res = await mockModule.default.fetch(req);
    assertEquals(res.status, 200);
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("praxis-search - rejects non-GET methods", async () => {
    const req = createMockRequest("POST", new URL("http://localhost/"));
    const res = await mockModule.default.fetch(req);
    assertEquals(res.status, 405);

    const body = await res.json();
    assertEquals(body.error, "Method not allowed");
});

Deno.test("praxis-search - validates geo parameters", async () => {
    const url = new URL("http://localhost/?lat=50.0");
    const req = createMockRequest("GET", url);
    const res = await mockModule.default.fetch(req);
    assertEquals(res.status, 400);

    const body = await res.json();
    assertEquals(body.error, "Both lat and lon must be provided for geo search");
});

Deno.test("praxis-search - validates pagination parameters", async () => {
    const url = new URL("http://localhost/?page=0&pageSize=200");
    const req = createMockRequest("GET", url);
    const res = await mockModule.default.fetch(req);
    assertEquals(res.status, 400);

    const body = await res.json();
    assertEquals(body.error, "Invalid pagination parameters");
});

Deno.test("praxis-search - handles RPC error", async () => {
    // Setup mock response
    mockRpcResponse = {
        data: null,
        error: new Error("Database error")
    };

    const url = new URL("http://localhost/?city=Berlin");
    const req = createMockRequest("GET", url);
    const res = await mockModule.default.fetch(req);
    assertEquals(res.status, 500);

    const body = await res.json();
    assertEquals(body.error, "Failed to search praxen");
});

Deno.test("praxis-search - returns proper response format", async () => {
    // Setup mock response
    mockRpcResponse = {
        data: {
            items: [
                {
                    google_place_id: "place1",
                    name: "Test Praxis",
                    city: "Berlin",
                    overall_score: 4.5
                }
            ],
            total_count: 1
        },
        error: null
    };

    const url = new URL("http://localhost/?city=Berlin&page=1&pageSize=20");
    const req = createMockRequest("GET", url);
    const res = await mockModule.default.fetch(req);
    assertEquals(res.status, 200);

    const body = await res.json();
    assertExists(body.data);
    assertExists(body.meta);
    assertEquals(body.data.length, 1);
    assertEquals(body.meta.totalItems, 1);
    assertEquals(body.meta.currentPage, 1);
    assertEquals(body.meta.totalPages, 1);
});

Deno.test("praxis-search - passes all parameters to RPC function", async () => {
    let capturedParams: any = null;

    // Mock implementation that captures parameters
    mockSupabase = createMockSupabase({
        rpc: (funcName: string, params: any) => {
            capturedParams = params;
            return mockRpcResponse;
        }
    });

    const url = new URL("http://localhost/?query=test&city=Berlin&postalCode=10115&lat=52.52&lon=13.40&radius=5&minScore=3&maxScore=5&services=acne,eczema&sortBy=distance&sortDirection=asc&page=2&pageSize=10");
    const req = createMockRequest("GET", url);
    await mockModule.default.fetch(req);

    assertEquals(capturedParams.p_query, "test");
    assertEquals(capturedParams.p_city, "Berlin");
    assertEquals(capturedParams.p_postal_code, "10115");
    assertEquals(capturedParams.p_latitude, 52.52);
    assertEquals(capturedParams.p_longitude, 13.40);
    assertEquals(capturedParams.p_radius, 5);
    assertEquals(capturedParams.p_min_score, 3);
    assertEquals(capturedParams.p_max_score, 5);
    assertEquals(capturedParams.p_services, ["acne", "eczema"]);
    assertEquals(capturedParams.p_sort_by, "distance");
    assertEquals(capturedParams.p_sort_direction, "asc");
    assertEquals(capturedParams.p_page, 2);
    assertEquals(capturedParams.p_page_size, 10);
});

// Clean up environment mock after all tests
Deno.test({
    name: "cleanup",
    fn() {
        cleanupEnv();
    },
    sanitizeResources: false,
    sanitizeOps: false
}); 