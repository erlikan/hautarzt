// supabase/functions/praxis-search/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { checkRateLimit } from '../_shared/rateLimiter.ts';
import type { ServeHandlerInfo } from "https://deno.land/std@0.177.0/http/server.ts";

// Allowed values for sorting
const ALLOWED_SORT_BY = ['score', 'distance', 'name', 'overall_score'];
const ALLOWED_SORT_DIR = ['asc', 'desc'];
const MAX_PAGE_SIZE = 50;
const MAX_RADIUS_METERS = 100000; // 100km
const MAX_CONTEXT_SLUG_LENGTH = 100;
const GERMAN_ZIP_REGEX = /^\d{5}$/;

// Helper function for aspect status (keep as is)
function getAspectStatus(positive: number | null | undefined, negative: number | null | undefined): string {
  // ... (implementation)
  if (positive === null || positive === undefined || negative === null || negative === undefined) return 'unknown';
  const pos = Number(positive);
  const neg = Number(negative);
  if (isNaN(pos) || isNaN(neg)) return 'unknown';
  if (pos > 60 && pos > neg * 1.5) return 'positive';
  if (neg > 40 && neg > pos * 1.5) return 'negative';
  return 'neutral';
}

// --- Main Handler ---
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

  // Check Env Vars
  const SUPABASE_URL = Deno.env.get("HAUTARZT_SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("HAUTARZT_SUPABASE_ANON_KEY");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase URL or Anon Key environment variables.");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const url = new URL(req.url);
  const queryParams = url.searchParams;
  const validationErrors: string[] = [];

  // --- Parameter Extraction & Validation --- 

  const contextCitySlug = queryParams.get('stadtSlug') || undefined;
  if (contextCitySlug && contextCitySlug.length > MAX_CONTEXT_SLUG_LENGTH) {
    validationErrors.push('Parameter stadtSlug exceeds maximum length.');
  }

  const filterPostalCode = queryParams.get('plz') || undefined;
  if (filterPostalCode && !GERMAN_ZIP_REGEX.test(filterPostalCode)) {
    validationErrors.push('Invalid format for parameter plz.');
  }

  const filterServiceIdsParam = queryParams.get('services');
  let filterServiceIds: number[] | undefined = undefined;
  if (filterServiceIdsParam) {
    const ids = filterServiceIdsParam.split(',')
      .map(id => id.trim())
      .filter(id => id !== '') // Filter out empty strings from double commas
      .map(id => parseInt(id, 10));

    if (ids.some(id => isNaN(id) || id <= 0)) { // Check for NaN or non-positive
      validationErrors.push('Invalid format for parameter services. Expected comma-separated positive integers.');
    } else {
      filterServiceIds = ids;
    }
  }

  const filterMinScoreParam = queryParams.get('minScore');
  let filterMinScore: number | undefined = undefined;
  if (filterMinScoreParam !== null) {
    filterMinScore = parseFloat(filterMinScoreParam);
    if (isNaN(filterMinScore) || filterMinScore < 0 || filterMinScore > 100) {
      validationErrors.push('Parameter minScore must be a number between 0 and 100.');
      filterMinScore = undefined; // Reset to undefined if invalid
    }
  }

  let geoLat: number | undefined = undefined;
  let geoLon: number | undefined = undefined;
  const latParam = queryParams.get('lat');
  const lonParam = queryParams.get('lon');
  if (latParam !== null || lonParam !== null) {
    if (latParam === null || lonParam === null) {
      validationErrors.push('Both lat and lon parameters are required together.');
    } else {
      const parsedLat = parseFloat(latParam);
      const parsedLon = parseFloat(lonParam);
      if (isNaN(parsedLat) || isNaN(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
        validationErrors.push('Invalid values for lat/lon parameters.');
      } else {
        geoLat = parsedLat;
        geoLon = parsedLon;
      }
    }
  }

  const geoRadiusMetersParam = queryParams.get('radius');
  let geoRadiusMeters: number | undefined = undefined;
  if (geoRadiusMetersParam !== null) {
    geoRadiusMeters = parseInt(geoRadiusMetersParam, 10);
    if (isNaN(geoRadiusMeters) || geoRadiusMeters <= 0 || geoRadiusMeters > MAX_RADIUS_METERS) {
      validationErrors.push(`Parameter radius must be a positive integer up to ${MAX_RADIUS_METERS}.`);
      geoRadiusMeters = undefined; // Reset
    }
  }

  const pageParam = queryParams.get('page');
  let page = 1;
  if (pageParam !== null) {
    const parsedPage = parseInt(pageParam, 10);
    if (isNaN(parsedPage) || parsedPage < 1) {
      validationErrors.push('Parameter page must be a positive integer.');
    } else {
      page = parsedPage;
    }
  }

  const pageSizeParam = queryParams.get('pageSize');
  let pageSize = 20;
  if (pageSizeParam !== null) {
    const parsedPageSize = parseInt(pageSizeParam, 10);
    if (isNaN(parsedPageSize) || parsedPageSize < 1 || parsedPageSize > MAX_PAGE_SIZE) {
      validationErrors.push(`Parameter pageSize must be between 1 and ${MAX_PAGE_SIZE}.`);
    } else {
      pageSize = parsedPageSize;
    }
  }

  const sortByParam = queryParams.get('sortBy');
  let sortBy = (geoLat !== undefined && geoLon !== undefined ? 'distance' : 'overall_score'); // Default based on valid geo
  if (sortByParam) {
    if (ALLOWED_SORT_BY.includes(sortByParam)) {
      sortBy = sortByParam;
    } else {
      validationErrors.push(`Invalid value for parameter sortBy. Allowed: ${ALLOWED_SORT_BY.join(', ')}`);
    }
  }

  const sortDirectionParam = queryParams.get('sortDirection');
  let sortDirection = (sortBy === 'distance' ? 'asc' : 'desc'); // Default based on final sortBy
  if (sortDirectionParam) {
    if (ALLOWED_SORT_DIR.includes(sortDirectionParam)) {
      sortDirection = sortDirectionParam;
    } else {
      validationErrors.push(`Invalid value for parameter sortDirection. Allowed: ${ALLOWED_SORT_DIR.join(', ')}`);
    }
  }

  // --- Return 400 if Validation Errors --- 
  if (validationErrors.length > 0) {
    console.warn("Praxis Search Validation Errors:", validationErrors);
    return new Response(JSON.stringify({ error: "Invalid request parameters.", details: validationErrors }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Calculate offset (uses validated page/pageSize)
  const offset = (page - 1) * pageSize;

  // --- RPC Parameter Objekt (Uses validated/processed variables) ---
  const rpcParams = {
    _context_city_slug: contextCitySlug,
    _filter_postal_code: filterPostalCode,
    _filter_service_ids: filterServiceIds,
    _filter_min_score: filterMinScore,
    _geo_lat: geoLat,
    _geo_lon: geoLon,
    _geo_radius_meters: geoRadiusMeters,
    _sort_by: sortBy,
    _sort_direction: sortDirection,
    _page_size: pageSize,
    _offset: offset
  };

  // ... (rest of the function: RPC call, mapping, response) ...
  try {
    const { data: resultItems, error: rpcError } = await supabase.rpc('search_praxen', rpcParams);

    if (rpcError) {
      console.error('Error calling search_praxen RPC:', rpcError);
      return new Response(JSON.stringify({ error: `RPC Error: ${rpcError.message}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const items = (resultItems as any[]) || [];
    const totalItems = items.length > 0 ? Number(items[0].total_count ?? 0) : 0;

    const totalPages = Math.ceil(totalItems / pageSize);
    const meta = {
      currentPage: page,
      pageSize: pageSize,
      totalItems: totalItems,
      totalPages: totalPages
    };

    const responseData = items.map((p: any) => {
      const analysis = p.analysis || {};
      // Determine the final score to display
      const displayScore = analysis.overall_score !== null && analysis.overall_score !== undefined
        ? parseFloat(analysis.overall_score)
        : (p.calculated_sort_score !== null && p.calculated_sort_score !== undefined
          ? parseFloat(p.calculated_sort_score)
          : null);
      // Get the score source tier
      const scoreTier = p.score_availability_tier !== null && p.score_availability_tier !== undefined
        ? Number(p.score_availability_tier)
        : 3; // Default to tier 3 (no score) if missing

      return {
        google_place_id: p.google_place_id,
        slug: p.slug,
        name: p.name,
        address: p.full_address,
        city: p.city,
        city_slug: p.city_slug,
        postal_code: p.postal_code,
        photo: p.photo,
        latitude: p.latitude ? parseFloat(p.latitude) : null,
        longitude: p.longitude ? parseFloat(p.longitude) : null,
        category: p.category,
        subtypes: p.subtypes,
        located_in: p.located_in,
        business_status: p.business_status,
        bewertung_count: p.reviews !== null && p.reviews !== undefined ? Number(p.reviews) : null,
        distance_meters: p.distance_meters ? parseFloat(p.distance_meters) : null,

        // Use the determined score and tier
        overall_score: displayScore,
        score_source_tier: scoreTier,

        // Keep analysis details separate but available if needed
        analysis_summary_snippet: analysis.zusammenfassung ? (analysis.zusammenfassung.substring(0, 150) + (analysis.zusammenfassung.length > 150 ? '...' : '')) : null,
        analysis_tags: analysis.tags?.slice(0, 3) || [],
        analysis_aspects_status: {
          termin_wartezeit: getAspectStatus(analysis.termin_wartezeit_positiv, analysis.termin_wartezeit_negativ),
          freundlichkeit_empathie: getAspectStatus(analysis.freundlichkeit_empathie_positiv, analysis.freundlichkeit_empathie_negativ),
          aufklaerung_vertrauen: getAspectStatus(analysis.aufklaerung_vertrauen_positiv, analysis.aufklaerung_vertrauen_negativ),
          kompetenz_behandlung: getAspectStatus(analysis.kompetenz_behandlung_positiv, analysis.kompetenz_behandlung_negativ),
          praxis_ausstattung: getAspectStatus(analysis.praxis_ausstattung_positiv, analysis.praxis_ausstattung_negativ)
        },
        offered_service_names: analysis.services || [],
        award_badges: [],
      };
    });

    const apiResponse = { data: responseData, meta: meta };

    return new Response(JSON.stringify(apiResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Error in praxis-search function:', err);
    return new Response(JSON.stringify({ error: `Server Error: ${err.message}` }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
