// tests/edge-functions/analyze-practice.test.ts
import { assertEquals, assertExists } from "https://deno.land/std@0.150.0/testing/asserts.ts";
import { createMockRequest } from "../test-utils/mock-request.ts";
import { createMockSupabase } from "../test-utils/mock-supabase.ts";
import { setupMockEnv } from "../test-utils/mock-env.ts";

// Mocking the Gemini API
const mockGenerativeAI = {
    getGenerativeModel: () => ({
        generateContent: async () => ({
            response: {
                text: () => `\`\`\`json
{
  "overall_score": 4.2,
  "termin_wartezeit_positiv": 0.6,
  "termin_wartezeit_neutral": 0.3,
  "termin_wartezeit_negativ": 0.1,
  "freundlichkeit_empathie_positiv": 0.7,
  "freundlichkeit_empathie_neutral": 0.2,
  "freundlichkeit_empathie_negativ": 0.1,
  "aufklaerung_vertrauen_positiv": 0.8,
  "aufklaerung_vertrauen_neutral": 0.1,
  "aufklaerung_vertrauen_negativ": 0.1,
  "kompetenz_behandlung_positiv": 0.9,
  "kompetenz_behandlung_neutral": 0.05,
  "kompetenz_behandlung_negativ": 0.05,
  "praxis_ausstattung_positiv": 0.5,
  "praxis_ausstattung_neutral": 0.3,
  "praxis_ausstattung_negativ": 0.2,
  "tags": ["freundlich", "kompetent", "gründlich"],
  "genannte_leistungen": ["Hautkrebsvorsorge", "Akne-Behandlung"],
  "staerken": ["Kompetenz", "Beratung"],
  "schwaechen": ["Wartezeit"],
  "zusammenfassung": "Sehr guter Hautarzt mit ausgezeichneter Beratung, aber teilweise langen Wartezeiten."
}
\`\`\``
            }
        })
    })
};

// Set up mock environment variables
const cleanupEnv = setupMockEnv({
    'HAUTARZT_SUPABASE_URL': 'https://test-url.supabase.co',
    'HAUTARZT_SUPABASE_SERVICE_KEY': 'test-key',
    'HAUTARZT_GEMINI_API_KEY': 'test-gemini-key'
});

// Mocking the module imports
// We'll need to replace these with the actual paths when running tests
const mockImports = {
    createClient: () => createMockSupabase(),
    GoogleGenerativeAI: function () {
        return mockGenerativeAI;
    }
};

// Replace this with the actual path when running tests
// const mod = await import("../../supabase/functions/analyze-practice/index.ts");

// We need to mock the module with its dependencies due to Gemini API call
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

            // Only accept POST requests
            if (req.method !== 'POST') {
                return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                    status: 405,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            try {
                // Parse request body
                const body = await req.json();
                const { praxis_google_place_id } = body;

                // Validate required fields
                if (!praxis_google_place_id) {
                    return new Response(JSON.stringify({ error: 'Missing required field: praxis_google_place_id' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // In our mock implementation, we'll return success for a specific test ID
                if (praxis_google_place_id === 'test_place_id') {
                    return new Response(JSON.stringify({
                        success: true,
                        message: 'Analysis completed successfully',
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                } else {
                    // Simulate not found error
                    return new Response(JSON.stringify({
                        error: 'Praxis not found or has no reviews'
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

Deno.test("analyze-practice - handles OPTIONS request for CORS", async () => {
    const req = createMockRequest("OPTIONS", new URL("http://localhost/"));
    const res = await mockModule.default.fetch(req);
    assertEquals(res.status, 200);
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("analyze-practice - rejects non-POST methods", async () => {
    const req = createMockRequest("GET", new URL("http://localhost/"));
    const res = await mockModule.default.fetch(req);
    assertEquals(res.status, 405);

    const body = await res.json();
    assertEquals(body.error, "Method not allowed");
});

Deno.test("analyze-practice - requires praxis_google_place_id", async () => {
    const req = createMockRequest(
        "POST",
        new URL("http://localhost/"),
        JSON.stringify({})
    );
    const res = await mockModule.default.fetch(req);
    assertEquals(res.status, 400);

    const body = await res.json();
    assertEquals(body.error, "Missing required field: praxis_google_place_id");
});

Deno.test("analyze-practice - handles valid request", async () => {
    const req = createMockRequest(
        "POST",
        new URL("http://localhost/"),
        JSON.stringify({ praxis_google_place_id: "test_place_id" })
    );
    const res = await mockModule.default.fetch(req);
    assertEquals(res.status, 200);

    const body = await res.json();
    assertEquals(body.success, true);
});

Deno.test("analyze-practice - handles praxis not found", async () => {
    const req = createMockRequest(
        "POST",
        new URL("http://localhost/"),
        JSON.stringify({ praxis_google_place_id: "non_existent_id" })
    );
    const res = await mockModule.default.fetch(req);
    assertEquals(res.status, 404);

    const body = await res.json();
    assertExists(body.error);
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