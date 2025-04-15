-- Drop the existing function first to allow changing the return table structure
DROP FUNCTION IF EXISTS public.search_praxen(
    text,
    text,
    integer[],
    numeric,
    numeric,
    numeric,
    integer,
    text,
    text,
    integer,
    integer
);

-- Now create the function with the new return signature
CREATE OR REPLACE FUNCTION public.search_praxen(
    _context_city_slug text DEFAULT NULL::text, 
    _filter_postal_code text DEFAULT NULL::text, 
    _filter_service_ids integer[] DEFAULT NULL::integer[], 
    _filter_min_score numeric DEFAULT NULL::numeric, 
    _geo_lat numeric DEFAULT NULL::numeric, 
    _geo_lon numeric DEFAULT NULL::numeric, 
    _geo_radius_meters integer DEFAULT 20000, 
    _sort_by text DEFAULT 'overall_score'::text, 
    _sort_direction text DEFAULT 'desc'::text, 
    _page_size integer DEFAULT 20, 
    _offset integer DEFAULT 0
)
 RETURNS TABLE(
    total_count bigint, 
    google_place_id text, 
    slug text, 
    name text, 
    full_address text, 
    city text, 
    city_slug text, 
    postal_code text, 
    latitude numeric, 
    longitude numeric, 
    photo text, 
    booking_appointment_link text, 
    about jsonb, 
    -- Add category and subtypes to RETURN definition
    category text, 
    subtypes text[], 
    analysis jsonb, 
    distance_meters numeric, 
    business_status text, 
    located_in text
)
 LANGUAGE plpgsql
AS $function$
DECLARE
    _origin GEOGRAPHY;
    v_where_conditions TEXT[] := ARRAY['p.business_status != ''CLOSED_PERMANENTLY'''];
    v_join_services_clause TEXT := ''; -- Initialize empty join clause for services
    v_final_where_clause TEXT;
BEGIN
    -- Origin Point (for distance calculation/sorting)
    IF _geo_lat IS NOT NULL AND _geo_lon IS NOT NULL THEN
        _origin := ST_SetSRID(ST_MakePoint(_geo_lon, _geo_lat), 4326);
    ELSE
        _origin := NULL;
    END IF;

    -- WHERE Bedingungen aufbauen
    -- 1. Primary Context Filter (City Slug) - Requires city_normalized column & unaccent
    IF _context_city_slug IS NOT NULL THEN
        v_where_conditions := array_append(v_where_conditions,
            format('p.city_normalized = lower(unaccent(%L))', _context_city_slug)
        );
    END IF;

    -- 2. Optional Specific Filters
    IF _filter_postal_code IS NOT NULL THEN
        v_where_conditions := array_append(v_where_conditions, format('p.postal_code = %L', _filter_postal_code));
    END IF;
    IF _filter_min_score IS NOT NULL THEN
        v_where_conditions := array_append(v_where_conditions, format('pa.overall_score IS NOT NULL AND pa.overall_score >= %L', _filter_min_score));
    END IF;
    IF _filter_service_ids IS NOT NULL AND array_length(_filter_service_ids, 1) > 0 THEN
        v_join_services_clause := ' INNER JOIN praxis_service ps_filter ON p.google_place_id = ps_filter.praxis_google_place_id ';
        v_where_conditions := array_append(v_where_conditions, format('ps_filter.service_id = ANY(%L::int[])', _filter_service_ids));
    END IF;
    -- Optional: Radius filter could still be added if needed for geo-context searches
    IF _origin IS NOT NULL AND _geo_radius_meters IS NOT NULL THEN
         v_where_conditions := array_append(v_where_conditions, format('p.location IS NOT NULL AND ST_DWithin(p.location::geography, %L::geography, %L)', _origin, _geo_radius_meters));
    END IF;

    -- Build final WHERE clause string
    IF array_length(v_where_conditions, 1) > 0 THEN
      v_final_where_clause := ' WHERE ' || array_to_string(v_where_conditions, ' AND ');
    ELSE
      -- Its unlikely we want to search without *any* context,
      -- but handle case of no filters (return empty or adjust logic)
      -- For safety, lets ensure at least city context exists if no other filters used
       IF _context_city_slug IS NULL THEN
          -- Or maybe raise an error? Depending on desired behaviour.
          v_final_where_clause := ' WHERE FALSE '; -- Effectively return no results if no context
       ELSE
           v_final_where_clause := ' WHERE ' || array_to_string(v_where_conditions, ' AND ');
       END IF;
    END IF;


    -- Base query structure with CTE
    RETURN QUERY EXECUTE format('\n        WITH FilteredPraxis AS (\n            SELECT p.google_place_id\n            FROM praxis p\n            LEFT JOIN praxis_analysis pa ON p.google_place_id = pa.praxis_google_place_id\n            %1$s -- Service Join Placeholder\n            %2$s -- WHERE Clause Placeholder\n        ), TotalCount AS (\n           SELECT count(*) as total FROM FilteredPraxis\n        )\n        SELECT\n           tc.total,\n           p.google_place_id, p.slug, p.name, p.full_address, p.city,\n           p.city_slug, -- Select the pre-computed city_slug\n           p.postal_code,\n           p.latitude::numeric, p.longitude::numeric, p.photo, p.booking_appointment_link, p.about,\n           -- Add category and subtypes to SELECT list
           p.category, p.subtypes, \n           -- Build analysis JSON object (Correctly escaped quotes)
           jsonb_build_object(\n                \'\'overall_score\'\', pa.overall_score,\n                \'\'termin_wartezeit_positiv\'\', pa.termin_wartezeit_positiv, \'\'termin_wartezeit_negativ\'\', pa.termin_wartezeit_negativ,\n                \'\'freundlichkeit_empathie_positiv\'\', pa.freundlichkeit_empathie_positiv, \'\'freundlichkeit_empathie_negativ\'\', pa.freundlichkeit_empathie_negativ,\n                \'\'aufklaerung_vertrauen_positiv\'\', pa.aufklaerung_vertrauen_positiv, \'\'aufklaerung_vertrauen_negativ\'\', pa.aufklaerung_vertrauen_negativ,\n                \'\'kompetenz_behandlung_positiv\'\', pa.kompetenz_behandlung_positiv, \'\'kompetenz_behandlung_negativ\'\', pa.kompetenz_behandlung_negativ,\n                \'\'praxis_ausstattung_positiv\'\', pa.praxis_ausstattung_positiv, \'\'praxis_ausstattung_negativ\'\', pa.praxis_ausstattung_negativ,\n                \'\'zusammenfassung\'\', pa.zusammenfassung,\n                \'\'tags\'\', pa.tags,\n                \'\'services\'\', (SELECT jsonb_agg(s.name) FROM praxis_service ps_agg JOIN service s ON s.id = ps_agg.service_id WHERE ps_agg.praxis_google_place_id = p.google_place_id)\n           ) as analysis,\n           -- Distance Calculation\n           (CASE WHEN %3$L IS NOT NULL THEN ST_Distance(p.location::geography, %3$L::geography) ELSE NULL END)::numeric as distance_meters,\n           p.business_status, p.located_in\n        FROM praxis p\n        JOIN FilteredPraxis fp ON p.google_place_id = fp.google_place_id\n        CROSS JOIN TotalCount tc\n        LEFT JOIN praxis_analysis pa ON p.google_place_id = pa.praxis_google_place_id\n        ORDER BY\n            -- Sorting Logic (Correctly escaped quotes)
            CASE WHEN %4$L = \'\'distance\'\' AND %3$L IS NOT NULL THEN ST_Distance(p.location::geography, %3$L::geography) ELSE NULL END %5$s NULLS LAST,\n            CASE WHEN %4$L = \'\'name\'\' THEN p.name ELSE NULL END %5$s NULLS LAST,\n            CASE WHEN %4$L = \'\'overall_score\'\' THEN pa.overall_score ELSE NULL END %5$s NULLS %6$s,\n            p.google_place_id ASC -- Tie-breaker\n        LIMIT %7$L OFFSET %8$L;\n        ',\n        v_join_services_clause, -- %1$s\n        v_final_where_clause, -- %2$s\n        _origin, -- %3$L (_geo_lat/_geo_lon)\n        _sort_by, -- %4$L\n        CASE WHEN _sort_direction = 'asc' THEN 'ASC' ELSE 'DESC' END, -- %5$s
        CASE WHEN _sort_direction = 'asc' THEN 'FIRST' ELSE 'LAST' END, -- %6$s (for overall_score NULLS position)
        _page_size, -- %7$L
        _offset -- %8$L
    );

END;$function$ 