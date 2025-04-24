/// <reference types="https://deno.land/x/service_worker@0.1.0-alpha.2/lib.d.ts" />
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "https://esm.sh/@google/generative-ai";

console.log("Hello from Functions!")

const BATCH_SIZE = 50; // Number of services to process per invocation

interface ServiceClassification {
  name: string;
  is_relevant: boolean;
}

// --- Gemini Prompt Function ---
function buildClassificationPrompt(serviceNames: string[]): string {
  const serviceList = serviceNames.map(name => `- "${name}"`).join('\\n');
  return `\nDu bist ein KI-Experte für medizinische Leistungen, spezialisiert auf Dermatologie (Hautarzt).\nDeine Aufgabe: Klassifiziere die folgende Liste von Service-Namen. Entscheide für jeden Service, ob er **typischerweise von einem Hautarzt angeboten wird oder relevant für dermatologische Behandlungen ist**.\n\n**Liste der Service-Namen:**\n${serviceList}\n\n**Deine Aufgabe:** Gib **ausschließlich** ein valides JSON-Array zurück. Jedes Objekt im Array soll zwei Felder enthalten:\n1.  name: (string) Der exakte Service-Name aus der Eingabeliste.\n2.  is_relevant: (boolean) Setze dies auf true, wenn der Service relevant für Dermatologie ist, andernfalls auf false.\n\n**Beispiele für relevante Services:**\n- Hautkrebsvorsorge\n- Aknebehandlung\n- Lasertherapie (für Haut)\n- Allergietest\n- Botox (kosmetisch)\n- Muttermalentfernung\n- Ekzembehandlung\n\n**Beispiele für NICHT relevante Services (aus Sicht eines Hautarztes):**\n- Kardiologie Beratung\n- Zahnreinigung\n- Physiotherapie\n- Impfung (generisch, außer evtl. spezifische wie HPV)\n- Blutabnahme (generisch)\n\n**WICHTIG:** Die Ausgabe darf **ausschließlich** das JSON-Array enthalten. KEINE einleitenden oder abschließenden Sätze, KEINE Erklärungen, KEINE Markdown-Formatierung. Nur das nackte JSON-Array.\n\n**JSON-Ausgabe-Beispiel (Format):**\n[{\"name\": \"Beispiel Service 1\", \"is_relevant\": true}, {\"name\": \"Beispiel Service 2\", \"is_relevant\": false}]\n\n**JSON-Ausgabe (Echte Daten):**\n`;
}

// --- Database Update Function ---
async function updateServiceClassifications(supabaseAdmin: SupabaseClient, classifications: ServiceClassification[]) {
  if (!classifications || classifications.length === 0) {
    console.log("No classifications to update.");
    return;
  }

  console.log(`Updating classifications for ${classifications.length} services...`);

  // Prepare bulk updates
  // Supabase client doesn't directly support bulk updates based on different conditions in a single call.
  // We need to iterate and update. For larger scale, a stored procedure might be more efficient.
  let successfulUpdates = 0;
  let failedUpdates = 0;

  for (const classification of classifications) {
    // Basic validation before attempting update
    if (typeof classification.name === 'string' && typeof classification.is_relevant === 'boolean') {
      const { error } = await supabaseAdmin
        .from('service')
        .update({ is_relevant_dermatology: classification.is_relevant })
        .eq('name', classification.name) // Assuming 'name' is unique or we want to update all matches
        .is('is_relevant_dermatology', false); // Only update if not already classified (safety)

      if (error) {
        console.error(`Failed to update service "${classification.name}":`, error.message);
        failedUpdates++;
      } else {
        successfulUpdates++;
      }
    } else {
      console.warn(`Skipping invalid classification object: ${JSON.stringify(classification)}`);
      failedUpdates++; // Count as failed as it couldn't be processed
    }
  }

  console.log(`Database update complete. Successful: ${successfulUpdates}, Failed: ${failedUpdates}`);
  if (failedUpdates > 0) {
    // Optionally throw an error or return a specific status if failures occurred
    console.error(`${failedUpdates} updates failed.`);
  }
}


// --- Main Handler ---
serve(async (_req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // --- Environment Variables ---
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  const HAUTARZT_SUPABASE_URL = Deno.env.get("HAUTARZT_SUPABASE_URL");
  const HAUTARZT_SUPABASE_SERVICE_KEY = Deno.env.get("HAUTARZT_SUPABASE_SERVICE_KEY");

  if (!GEMINI_API_KEY || !HAUTARZT_SUPABASE_URL || !HAUTARZT_SUPABASE_SERVICE_KEY) {
    console.error("Missing environment variables/secrets");
    return new Response(JSON.stringify({ error: "Internal configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // --- Client Initialization ---
  const supabaseAdmin: SupabaseClient = createClient(HAUTARZT_SUPABASE_URL, HAUTARZT_SUPABASE_SERVICE_KEY);
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Or appropriate model

  try {
    console.log(`Starting service classification process... Batch size: ${BATCH_SIZE}`);

    // --- 1. Fetch Unclassified Services ---
    const { data: services, error: fetchError } = await supabaseAdmin
      .from('service')
      .select('name')
      .is('is_relevant_dermatology', false) // Fetch only unclassified
      .limit(BATCH_SIZE);

    if (fetchError) {
      throw new Error(`Failed to fetch services: ${fetchError.message}`);
    }

    if (!services || services.length === 0) {
      console.log("No unclassified services found to process.");
      return new Response(JSON.stringify({ message: "No unclassified services found." }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const serviceNames = services.map((s: { name: string }) => s.name);
    console.log(`Fetched ${serviceNames.length} service names for classification.`);

    // --- 2. Build Prompt ---
    const prompt = buildClassificationPrompt(serviceNames);

    // --- 3. Call Gemini API ---
    console.log("Calling Gemini API...");
    const generationConfig = {
      temperature: 0.1, // Lower temperature for more deterministic classification
      responseMimeType: "application/json",
    };
    const safetySettings = [ /* Standard safety settings from analyze-practice */
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    let classificationsJsonText: string;
    let rawGeminiResponse: string;
    try {
      const result = await model.generateContent(prompt, generationConfig, safetySettings);
      const response = result.response;
      // Get raw text first
      rawGeminiResponse = response.text();

      if (!rawGeminiResponse) {
        const promptFeedback = response.promptFeedback;
        const finishReason = response.finishReason;
        throw new Error(`Gemini response blocked or empty. Reason: ${finishReason}, Feedback: ${JSON.stringify(promptFeedback)}`);
      }
      console.log(`Raw Gemini Response received: ${rawGeminiResponse.substring(0, 200)}...`);

      // Extract JSON Array block (similar to analyze-practice, but for array)
      const jsonMatch = rawGeminiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error(`Could not find JSON array block in Gemini response. Raw: ${rawGeminiResponse}`);
      }
      classificationsJsonText = jsonMatch[0]; // Use only the extracted JSON part
      console.log(`Extracted JSON String: ${classificationsJsonText.substring(0, 100)}...`);

    } catch (geminiError) {
      const errorMessage = geminiError instanceof Error ? geminiError.message : String(geminiError);
      throw new Error(`Gemini API call or extraction failed: ${errorMessage}`);
    }

    // --- 4. Parse and Validate Response ---
    console.log("Validating extracted Gemini JSON response...");
    let classifications: ServiceClassification[];
    try {
      // Parse the *extracted* JSON text
      classifications = JSON.parse(classificationsJsonText);
      // Basic validation
      if (!Array.isArray(classifications)) {
        throw new Error("Extracted response is not a JSON array.");
      }
      if (classifications.length > 0 && (typeof classifications[0].name !== 'string' || typeof classifications[0].is_relevant !== 'boolean')) {
        throw new Error("JSON array items do not have the expected structure ({name: string, is_relevant: boolean}).");
      }
      console.log(`Successfully parsed ${classifications.length} classifications from extracted Gemini JSON.`);
      // Optional: Add check if classifications.length matches serviceNames.length
      if (classifications.length !== serviceNames.length) {
        console.warn(`Warning: Number of classifications (${classifications.length}) does not match number of input services (${serviceNames.length}). Some services might not have been classified or Gemini response format issue.`);
      }

    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      // Log the *extracted* JSON string that failed parsing
      console.error(`Failed to parse or validate extracted Gemini JSON response: ${errorMessage}. Extracted JSON String: ${classificationsJsonText}`);
      throw new Error(`Invalid extracted JSON response from Gemini: ${errorMessage}`);
    }

    // --- 5. Update Database ---
    await updateServiceClassifications(supabaseAdmin, classifications);

    console.log("Service classification batch completed successfully.");
    return new Response(JSON.stringify({ success: true, message: `Processed ${classifications.length} services.` }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("--- ERROR DURING SERVICE CLASSIFICATION ---:", error);
    return new Response(JSON.stringify({ success: false, error: `Classification failed: ${errorMessage}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/classify-services' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
