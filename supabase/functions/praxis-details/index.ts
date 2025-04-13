// supabase/functions/praxis-details/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// --- TypeScript Interfaces für Datenstruktur (Anpassen an dein DB-Schema!) ---
// Diese Interfaces helfen bei der Code-Entwicklung und Typsicherheit.
// Sie sollten die Struktur widerspiegeln, wie sie die API zurückgeben soll.

interface Service {
  id: number;
  name: string;
}

// Interface für die Analyse-Daten (Spalten aus praxis_analysis)
interface PraxisAnalysis {
  praxis_google_place_id: string;
  termin_wartezeit_positiv?: number | null;
  termin_wartezeit_neutral?: number | null;
  termin_wartezeit_negativ?: number | null;
  freundlichkeit_empathie_positiv?: number | null;
  // ... alle anderen Aspekt-Spalten ...
  praxis_ausstattung_negativ?: number | null;
  tags?: string[] | null;
  staerken?: string[] | null;
  schwaechen?: string[] | null;
  mentioned_doctors?: string[] | null;
  emotionale_tags?: string[] | null;
  haeufig_genannte_begriffe?: string[] | null;
  trend?: 'positiv' | 'negativ' | 'neutral' | null;
  trend_begruendung?: string | null;
  vergleich_kasse_privat?: string | null;
  zusammenfassung?: string | null;
  overall_score?: number | null; // Hier DECIMAL als number
  analyzed_at?: string | null; // TIMESTAMPTZ als string (ISO Format)
  // last_error_message brauchen wir im Frontend nicht
}

// Interface für die Praxis-Daten (Spalten aus praxis)
interface PraxisBase {
  google_place_id: string;
  google_id?: string | null;
  name: string;
  slug?: string | null; // Wichtig für den Abruf
  full_address?: string | null;
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  state?: string | null;
  latitude?: number | null; // DECIMAL als number
  longitude?: number | null; // DECIMAL als number
  rating?: number | null; // DECIMAL als number
  reviews?: number | null;
  site?: string | null;
  phone?: string | null;
  category?: string | null;
  subtypes?: string[] | null;
  photo?: string | null;
  working_hours?: any | null; // JSONB als any oder spezifischeres Interface
  about?: any | null; // JSONB als any oder spezifischeres Interface
  booking_appointment_link?: string | null;
  // ... weitere praxis Felder nach Bedarf ...
}

// Kombiniertes Interface für die API-Antwort
interface PraxisDetail extends PraxisBase {
  analysis?: PraxisAnalysis | null; // Analyse kann fehlen
  services?: Service[] | null;      // Leistungen können fehlen
  award_badges?: string[]; // Platzhalter für zukünftige Badges
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Oder spezifische Domain für mehr Sicherheit
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Extract slugs from the URL path
  const url = new URL(req.url);
  const urlParts = url.pathname.split('/'); // e.g., ['', 'functions', 'v1', 'praxis-details', 'berlin', 'praxis-dr-muster']

  // Validate URL structure
  if (urlParts.length < 7) {
    return new Response(JSON.stringify({ error: "Invalid URL format. Expected /praxis-details/{stadtSlug}/{praxisSlug}" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const stadtSlug = urlParts[urlParts.length - 2];
  const praxisSlug = urlParts[urlParts.length - 1];

  // Basic validation for slugs
  if (!stadtSlug || !praxisSlug) {
    return new Response(JSON.stringify({ error: "Missing city or practice slug in URL" }), {
      status: 400,
      headers: corsHeaders,
    });
  }
  // console.log(`Request for stadtSlug: ${stadtSlug}, praxisSlug: ${praxisSlug}`);

  try {
    // Get Supabase connection details from environment variables
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.");
      return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500, headers: corsHeaders });
    }
    // Create Supabase client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // --- Daten aus Supabase holen ---
    // console.log(`Fetching details for praxis with slug: ${praxisSlug}`);

    // Wir nutzen Supabase's Fähigkeit, relationale Daten direkt mitzuladen.
    // Wir wählen alle Spalten von 'praxis', alle von 'praxis_analysis'
    // und die 'id' und 'name' von den verbundenen 'service'-Einträgen.
    const { data: praxisData, error: dbError } = await supabaseAdmin
      .from('praxis')
      .select(`
        *,
        analysis:praxis_analysis(*),
        services:service(id, name)
      `)
      .eq('slug', praxisSlug)
      // Optional: Zusätzlicher Filter nach Stadt, falls Slugs nicht global eindeutig sind
      // .eq('city_slug_oder_aehnliches', stadtSlug) // Benötigt ggf. eine 'city_slug'-Spalte in 'praxis'
      .maybeSingle(); // Erwarte 0 oder 1 Treffer

    if (dbError) {
      console.error("Database query error:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Praxis nicht gefunden
    if (!praxisData) {
      // console.warn(`Praxis with slug '${praxisSlug}' not found.`);
      return new Response(JSON.stringify({ error: "Praxis not found" }), { status: 404, headers: corsHeaders });
    }

    // Daten für die Antwort vorbereiten (Typisierung anpassen)
    const responseData: PraxisDetail = {
      ...praxisData, // Enthält alle Felder aus 'praxis'
      analysis: praxisData.analysis, // Enthält Felder aus 'praxis_analysis' (kann null sein)
      services: praxisData.services, // Enthält die verbundenen Services (kann leeres Array oder null sein)
      award_badges: [] // Platzhalter für Awards, muss später befüllt werden
    };

    // Erfolgreiche Antwort
    // console.log(`Successfully fetched details for praxis: ${praxisData.name}`);
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error("Unhandled error in praxis-details function:", error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});