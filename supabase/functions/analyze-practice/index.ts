// supabase/functions/analyze-practice/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "https://esm.sh/@google/generative-ai";
// --- Hilfsfunktion zum Prompt bauen ---
// (Identisch zu vorherigem Beispiel, hier zur Vollständigkeit)
function buildGeminiPrompt(praxis, reviews) {
  const praxisInfo = `
Praxis-Stammdaten:
Name: ${praxis.name}
Adresse: ${praxis.full_address || `${praxis.street || ''}, ${praxis.postal_code || ''} ${praxis.city || ''}`}
Stadt: ${praxis.city}
Fachrichtung: ${praxis.category || 'Hautarzt'} (Subtypen: ${praxis.subtypes?.join(', ') || 'N/A'})

Google-Gesamtbewertung: ${praxis.rating} Sterne (${praxis.reviews} Bewertungen)
Verteilung (1-5 Sterne): ${praxis.reviews_per_score_1 || 0}-${praxis.reviews_per_score_2 || 0}-${praxis.reviews_per_score_3 || 0}-${praxis.reviews_per_score_4 || 0}-${praxis.reviews_per_score_5 || 0}
  `.trim();
  const reviewLines = reviews.map((r) => `- ${r.review_rating} Sterne (${r.review_datetime_utc ? new Date(r.review_datetime_utc).toLocaleDateString('de-DE') : 'Datum unbekannt'}): ${r.review_text || ''}`).join('\n');
  // Innerhalb der buildGeminiPrompt Funktion:
  const prompt = `
Du bist ein KI-Assistenzsystem, spezialisiert auf die Analyse von Google-Rezensionen für Hautarztpraxen.
Deine Aufgabe: Analysiere die folgenden Patientenbewertungen und Stammdaten einer Praxis. Extrahiere die unten definierten Informationen und gib sie **ausschließlich** als valides JSON-Objekt zurück. Die Ausgabe soll **objektiv die typischen Patientenerfahrungen widerspiegeln**, ohne explizit auf die 'Bewertungen' oder 'Rezensionen' als Quelle zu verweisen. Formuliere die Texte so, als würdest du einen **Gesamteindruck der Praxis aus Patientensicht** wiedergeben und einem **Patienten** bei der Arztwahl helfen.

**Eingabedaten:**
${praxisInfo}

**Patientenbewertungen (neueste zuerst, max. 50):**
${reviewLines}

**Deine Aufgabe:** Erzeuge ein JSON-Objekt mit exakt den folgenden Feldern:

1.  \`praxis_name\`: (string) Exakter Name der Praxis.
2.  \`aspekte_bewertung\`: (object) Objekt mit fünf Schlüsseln: \`termin_wartezeit\`, \`freundlichkeit_empathie\`, \`aufklaerung_vertrauen\`, \`kompetenz_behandlung\`, \`praxis_ausstattung\`. Jeder Schlüssel enthält ein Objekt mit \`positiv\`, \`neutral\`, \`negativ\` als Schlüssel und Prozentwerten (0-100, ganze Zahl) als Wert. Die Summe pro Aspekt muss 100 ergeben. Wenn ein Aspekt kaum erwähnt wird, setze \`neutral\` auf 100.
3.  \`tags\`: (array of strings) 3-7 markante Stichworte/Phrasen, die die Praxis oder typische Erfahrungen gut charakterisieren (z.B. "freundliches Team", "lange Wartezeiten", "Online-Termin").
4.  \`genannte_leistungen\`: (array of strings) 3-5 spezifische medizinische oder kosmetische Leistungen, die in den Schilderungen erwähnt werden (z.B. "Hautkrebsvorsorge", "Laserbehandlung", "Allergietest"). Extrahiere nur, was genannt wird. Gib ein leeres Array zurück, wenn nichts genannt wird.
5.  \`staerken\`: (array of strings) 3-5 Hauptstärken der Praxis **aus Patientensicht**. Gib ein leeres Array zurück, wenn keine klaren Stärken genannt werden.
6.  \`schwaechen\`: (array of strings) 3-5 Hauptkritikpunkte oder Schwächen **aus Patientensicht**. Gib ein leeres Array zurück, wenn keine klaren Schwächen genannt werden.
7.  \`mentioned_doctors\`: (array of strings) Liste der Ärztenamen (z.B. "Dr. Meyer", "Frau Dr. Otto"), die im Zusammenhang mit dieser Praxis genannt werden. Gib ein leeres Array zurück, wenn keine Namen genannt werden.
8.  \`trend\`: (string) Einschätzung der jüngsten Patientenerfahrungen im Vergleich zum Gesamtbild: "positiv", "negativ" oder "neutral".
9.  \`trend_begruendung\`: (string) **Begründe** den Trend in einem kurzen Satz **aus der Perspektive der Patientenerfahrung**. Beispiel: 'In letzter Zeit berichten Patienten vermehrt von kürzeren Wartezeiten.' oder 'Zuletzt scheinen Probleme bei der telefonischen Erreichbarkeit häufiger aufzutreten.'
10. \`vergleich_kasse_privat\`: (string) Aussage, ob **Unterschiede in der Erfahrung** von Kassen- und Privatpatienten erkennbar sind (oder "Keine Unterschiede in der Patientenerfahrung erkennbar.").
11. \`emotionale_tags\`: (array of strings) 3-5 dominante Emotionen, die Patienten in Bezug auf ihre Erfahrungen äußern (z.B. "dankbar", "frustriert", "zufrieden").
12. \`zusammenfassung\`: (string) Formuliere eine **neutrale, informative Zusammenfassung** (ca. 3 Sätze) **der typischen Patientenerfahrungen** in dieser Praxis. Beschreibe, **was Patienten dort generell schätzen und was häufiger kritisiert wird**, ohne explizit 'Bewertungen' oder 'Rezensionen' zu nennen. Die Zusammenfassung soll einen authentischen Eindruck vermitteln, als würde man die Praxis gut kennen. Beispiel: 'Viele Patienten schätzen in dieser Praxis besonders die [Stärke 1] und die [Stärke 2]. Herausforderungen sehen einige jedoch bei [Schwäche 1], und [Schwäche 2] wird gelegentlich als verbesserungswürdig empfunden.'
13. \`haeufig_genannte_begriffe\`: (array of strings) Liste von 3-7 Substantiven oder kurzen Phrasen, die **auffällig oft oder signifikant** in den Schilderungen der Patientenerfahrungen vorkommen und **spezifische Einblicke** in Abläufe, Probleme oder Besonderheiten dieser Praxis geben. **Ignoriere dabei sehr generische Begriffe**, die in fast jeder Arztpraxis-Beschreibung vorkommen. **Schließe mindestens folgende Wörter und ihre Varianten aus:** 'Arzt', 'Ärztin', 'Doktor', 'Praxis', 'Patient', 'Patientin', 'Behandlung', 'medizinisch', 'gesundheitlich', 'Krankheit', 'Sprechstunde', 'Untersuchung'. Konzentriere dich stattdessen auf **hervorstechende Begriffe** wie z.B. 'Wartezeit', 'Empfang', 'Terminvergabe', 'Freundlichkeit', 'Kompetenz', 'Sauberkeit', 'online', 'Doctolib', 'Telefon', spezifische Leistungsnamen, Wartezimmer, Parkplatz etc.

**WICHTIG:** Gib **nur das JSON-Objekt** aus, ohne Erklärung, Markdown oder sonstigen Text davor oder danach. Stelle sicher, dass das JSON valide ist und alle Felder enthält, auch wenn sie leere Arrays oder Standardwerte haben.

JSON-Ausgabe:
`;
  return prompt;
}
// --- Stored Procedure Aufruf Funktion ---
// Diese Funktion ruft die PostgreSQL Stored Procedure auf, die wir in Schritt 8 erstellen werden.
async function callSaveAnalysisProcedure(supabaseAdmin, praxisGooglePlaceId, analysisResult) {
  console.log(`[${praxisGooglePlaceId}] Calling stored procedure save_analysis_data...`);
  return await supabaseAdmin.rpc('save_analysis_data', {
    p_praxis_google_place_id: praxisGooglePlaceId,
    p_analysis_data: analysisResult // Übergabe des gesamten JSON-Objekts
  });
}
// --- Haupt-Handler für die Function ---
serve(async (req) => {
  // CORS Headers (wichtig für Aufrufe aus dem Browser, optional für Server-zu-Server)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
  };
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  // Request-Verarbeitung
  if (req.method !== 'POST') {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders
    });
  }
  let praxisGooglePlaceId = null;
  try {
    const body = await req.json();
    praxisGooglePlaceId = body.praxis_google_place_id;
    if (!praxisGooglePlaceId) {
      throw new Error("Missing praxis_google_place_id in request body");
    }
  } catch (error) {
    console.error("Failed to parse request body:", error);
    return new Response(JSON.stringify({
      error: "Invalid request body"
    }), {
      status: 400,
      headers: corsHeaders
    });
  }
  // Secrets holen
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  const HAUTARZT_SUPABASE_URL = Deno.env.get("HAUTARZT_SUPABASE_URL");
  const HAUTARZT_SUPABASE_SERVICE_KEY = Deno.env.get("HAUTARZT_SUPABASE_SERVICE_KEY");
  if (!GEMINI_API_KEY || !HAUTARZT_SUPABASE_URL || !HAUTARZT_SUPABASE_SERVICE_KEY) {
    console.error("Missing environment variables/secrets");
    return new Response(JSON.stringify({
      error: "Internal configuration error"
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
  // Clients initialisieren
  const supabaseAdmin = createClient(HAUTARZT_SUPABASE_URL, HAUTARZT_SUPABASE_SERVICE_KEY);
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash"
  }); // Oder gemini-1.0-pro
  const logPrefix = `[${praxisGooglePlaceId}]`; // Für einfachere Log-Zuordnung
  try {
    console.log(`${logPrefix} Starting analysis...`);
    // --- Schritt 1: Daten aus Supabase holen ---
    console.log(`${logPrefix} Fetching data...`);
    const { data: praxisData, error: praxisError } = await supabaseAdmin.from('praxis').select('*, reviews_per_score_1, reviews_per_score_2, reviews_per_score_3, reviews_per_score_4, reviews_per_score_5') // Explizit alle benötigten Spalten auflisten
      .eq('google_place_id', praxisGooglePlaceId).single();
    if (praxisError || !praxisData) {
      throw new Error(`Praxis not found or DB error: ${praxisError?.message || 'No data'}`);
    }
    // Update Status auf 'processing'
    await supabaseAdmin.from('praxis').update({
      analysis_status: 'processing',
      updated_at: new Date().toISOString()
    }).eq('google_place_id', praxisGooglePlaceId);
    console.log(`${logPrefix} Status set to 'processing'.`);
    const { data: reviewsData, error: reviewsError } = await supabaseAdmin.from('review').select('review_text, review_rating, review_datetime_utc').eq('praxis_google_place_id', praxisGooglePlaceId).order('review_datetime_utc', {
      ascending: false
    }).limit(50);
    if (reviewsError) throw new Error(`Error fetching reviews: ${reviewsError.message}`);
    if (!reviewsData || reviewsData.length === 0) {
      console.warn(`${logPrefix} No reviews found. Setting status to 'completed' (empty analysis).`);
      await supabaseAdmin.from('praxis').update({
        analysis_status: 'completed',
        updated_at: new Date().toISOString()
      }).eq('google_place_id', praxisGooglePlaceId);
      // Optional: Leeren Eintrag in praxis_analysis anlegen?
      return new Response(JSON.stringify({
        message: "No reviews found, analysis skipped."
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    // --- Schritt 2: Prompt für Gemini bauen ---
    console.log(`${logPrefix} Building prompt with ${reviewsData.length} reviews...`);
    const prompt = buildGeminiPrompt(praxisData, reviewsData);
    // --- Schritt 3: Gemini API Call ---
    console.log(`${logPrefix} Calling Gemini API...`);
    const generationConfig = {
      temperature: 0.2,
      // maxOutputTokens: 8192, // Ggf. anpassen, falls nötig
      responseMimeType: "application/json"
    };
    // Sicherheitseinstellungen (optional, ggf. anpassen)
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      }
    ];
    // --- Schritt 3: Gemini API Call ---
    // ... (Code für den API Call bleibt gleich) ...
    let analysisJsonText;
    try {
      const result = await model.generateContent(prompt, generationConfig, safetySettings);
      const response = result.response;
      // ALT: analysisJsonText = response.text();
      // NEU: Roh-Text holen
      const rawGeminiResponse = response.text();
      if (!rawGeminiResponse) {
        const promptFeedback = response.promptFeedback;
        const finishReason = response.finishReason;
        throw new Error(`Gemini response blocked or empty. Reason: ${finishReason}, Feedback: ${JSON.stringify(promptFeedback)}`);
      }
      console.log(`${logPrefix} Raw Gemini Response received: ${rawGeminiResponse.substring(0, 100)}...`); // Logge Anfang der rohen Antwort
      // NEU: JSON extrahieren (entfernt Markdown-Fences)
      const jsonMatch = rawGeminiResponse.match(/\{[\s\S]*\}/); // Sucht den ersten Block von { bis }
      if (!jsonMatch) {
        throw new Error(`Could not find JSON block in Gemini response. Raw: ${rawGeminiResponse}`);
      }
      analysisJsonText = jsonMatch[0]; // Nimm nur den gefundenen JSON-Teil
      console.log(`${logPrefix} Extracted JSON String: ${analysisJsonText.substring(0, 100)}...`); // Logge Anfang des extrahierten JSON
    } catch (geminiError) {
      throw new Error(`Gemini API call or extraction failed: ${geminiError.message}`);
    }
    // --- Schritt 4: Response validieren ---
    console.log(`${logPrefix} Validating extracted JSON...`);
    let analysisResult;
    try {
      // Parse den *extrahierten* JSON-Text
      analysisResult = JSON.parse(analysisJsonText);
      // --- Einfache Validierung (Beispiele - ersetzen durch robustere Methode!) ---
      if (typeof analysisResult.praxis_name !== 'string' || typeof analysisResult.aspekte_bewertung?.termin_wartezeit?.positiv !== 'number' || !Array.isArray(analysisResult.tags) || ![
        'positiv',
        'negativ',
        'neutral'
      ].includes(analysisResult.trend)) {
        throw new Error("Extracted JSON has incorrect structure or types.");
      }
      console.log(`${logPrefix} Extracted JSON structure seems ok.`);
    } catch (parseOrValidationError) {
      // Gib hier den *extrahierten* JSON-String aus, der Probleme machte
      console.error(`${logPrefix} Extracted JSON validation failed: ${parseOrValidationError.message}. Extracted JSON String: ${analysisJsonText}`);
      throw new Error(`Invalid extracted JSON: ${parseOrValidationError.message}`);
    }
    // --- Schritt 5: Datenbank speichern mittels Stored Procedure ---
    // ... (Rest des Codes bleibt gleich) ...
    // --- Schritt 5: Datenbank speichern mittels Stored Procedure ---
    const { error: rpcError } = await callSaveAnalysisProcedure(supabaseAdmin, praxisGooglePlaceId, analysisResult);
    if (rpcError) {
      throw new Error(`Error calling stored procedure: ${rpcError.message}`);
    }
    // --- Schritt 6: Status in 'praxis' auf 'completed' setzen (wird jetzt in SP gemacht) ---
    // Wird jetzt in der Stored Procedure erledigt, um Atomarität zu gewährleisten.
    console.log(`${logPrefix} Analysis completed and saved successfully via stored procedure.`);
    return new Response(JSON.stringify({
      success: true,
      message: "Analysis completed."
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error(`${logPrefix} --- ERROR DURING ANALYSIS ---:`, error);
    // Versuch, Status auf 'failed' zu setzen
    try {
      await supabaseAdmin.from('praxis').update({
        analysis_status: 'failed',
        updated_at: new Date().toISOString()
      }).eq('google_place_id', praxisGooglePlaceId);
      // Optional: Fehler in praxis_analysis speichern (falls Eintrag existiert)
      await supabaseAdmin.from('praxis_analysis').upsert({
        praxis_google_place_id: praxisGooglePlaceId,
        last_error_message: error.message.substring(0, 1000) // Mehr Platz für Fehler
      }, {
        onConflict: 'praxis_google_place_id'
      });
      console.error(`${logPrefix} Status set to 'failed'.`);
    } catch (updateError) {
      console.error(`${logPrefix} Critical: Failed to even update status to failed:`, updateError);
    }
    // Gib detaillierteren Fehler zurück
    return new Response(JSON.stringify({
      success: false,
      error: `Analysis failed: ${error.message}`
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
