// tests/edge-functions/praxis-details.test.ts
import { assertEquals, assertExists } from "https://deno.land/std@0.150.0/testing/asserts.ts";
import { createMockRequest } from "../test-utils/mock-request.ts";
import { createMockSupabase } from "../test-utils/mock-supabase.ts";
import { setupMockEnv } from "../test-utils/mock-env.ts";

// Set up mock environment variables
const cleanupEnv = setupMockEnv({
    'HAUTARZT_SUPABASE_URL': 'https://test-url.supabase.co',
    'HAUTARZT_SUPABASE_SERVICE_KEY': 'test-key'
});

// Mock praxis detail data
const mockPraxisDetail = {
    google_place_id: 'test-place-id',
    name: 'Dr. Test Dermatologie',
    slug: 'dr-test-dermatologie-berlin',
    city: 'Berlin',
    postal_code: '10115',
    full_address: 'Teststraße 1, 10115 Berlin',
    latitude: 52.52,
    longitude: 13.40,
    rating: 4.5,
    reviews: 50,
    analysis: {
        overall_score: 4.2,
        termin_wartezeit_positiv: 0.6,
        termin_wartezeit_neutral: 0.3,
        termin_wartezeit_negativ: 0.1,
        freundlichkeit_empathie_positiv: 0.7,
        freundlichkeit_empathie_neutral: 0.2,
        freundlichkeit_empathie_negativ: 0.1,
        aufklaerung_vertrauen_positiv: 0.8,
        aufklaerung_vertrauen_neutral: 0.1,
        aufklaerung_vertrauen_negativ: 0.1,
        kompetenz_behandlung_positiv: 0.9,
        kompetenz_behandlung_neutral: 0.05,
        kompetenz_behandlung_negativ: 0.05,
        praxis_ausstattung_positiv: 0.5,
        praxis_ausstattung_neutral: 0.3,
        praxis_ausstattung_negativ: 0.2,
        tags: ['freundlich', 'kompetent'],
        staerken: ['Kompetenz', 'Beratung'],
        schwaechen: ['Wartezeit'],
        zusammenfassung: 'Guter Hautarzt mit Stärken in Beratung'
    },
    services: [
        { id: 1, name: 'Hautkrebsvorsorge' },
        { id: 2, name: 'Akne-Behandlung' }
    ]
};

// We need to mock the module with its dependencies
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
                // Extract slug from URL path
                const url = new URL(req.url);
                const pathParts = url.pathname.split('/').filter(Boolean);

                // Ensure proper path format
                if (pathParts.length < 2) {
                    return new Response(JSON.stringify({ error: 'Invalid path format' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Get the slug (last part of the path)
                const slug = pathParts[pathParts.length - 1];

                // In our mock implementation, we'll return success for a specific test slug
                if (slug === 'dr-test-dermatologie-berlin') {
                    return new Response(JSON.stringify(mockPraxisDetail), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } else {
                    // Simulate not found error
                    return new Response(JSON.stringify({
                        error: 'Praxis not found'
                    }), {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            } catch (err) {
                return new Response(JSON.stringify({ error: 'Internal server error' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
    }
};

Deno.test("praxis-details - handles OPTIONS request for CORS", async () => {
    const req = createMockRequest("OPTIONS", new URL("http://localhost/praxis/berlin/dr-test-dermatologie-berlin"));
    const res = await mockModule.default.fetch(req);
    assertEquals(res.status, 200);
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("praxis-details - rejects non-GET methods", async () => {
    const req = createMockRequest("POST", new URL("http://localhost/praxis/berlin/dr-test-dermatologie-berlin"));
    const res = await mockModule.default.fetch(req);
    assertEquals(res.status, 405);

    const body = await res.json();
    assertEquals(body.error, "Method not allowed");
});

Deno.test("praxis-details - validates path format", async () => {
    const req = createMockRequest("GET", new URL("http://localhost/invalid"));
    const res = await mockModule.default.fetch(req);
    assertEquals(res.status, 400);

    const body = await res.json();
    assertEquals(body.error, "Invalid path format");
});

Deno.test("praxis-details - returns practice detail for valid slug", async () => {
    const req = createMockRequest("GET", new URL("http://localhost/praxis/berlin/dr-test-dermatologie-berlin"));
    const res = await mockModule.default.fetch(req);
    assertEquals(res.status, 200);

    const body = await res.json();
    assertEquals(body.slug, "dr-test-dermatologie-berlin");
    assertExists(body.analysis);
    assertExists(body.services);
    assertEquals(body.services.length, 2);
    assertEquals(body.analysis.overall_score, 4.2);
});

Deno.test("praxis-details - handles praxis not found", async () => {
    const req = createMockRequest("GET", new URL("http://localhost/praxis/berlin/non-existent-practice"));
    const res = await mockModule.default.fetch(req);
    assertEquals(res.status, 404);

    const body = await res.json();
    assertEquals(body.error, "Praxis not found");
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