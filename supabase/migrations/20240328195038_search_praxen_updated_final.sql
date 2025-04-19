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
    located_in text,
    reviews integer
)
 LANGUAGE plpgsql
AS $function$
DECLARE
    _origin GEOGRAPHY;
    v_where_conditions TEXT[] := ARRAY['p.business_status != ''CLOSED_PERMANENTLY'''];
    v_join_services_clause TEXT := ''; -- Initialize empty join clause for services
    v_final_where_clause TEXT;
    -- Added variable for ORDER BY clause
    v_order_by_clause TEXT;
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

    -- Determine ORDER BY clause based on input
    IF _sort_by = 'distance' AND _origin IS NOT NULL THEN
         -- Sort primarily by distance, then relevance, then score
         v_order_by_clause := format(
            'ORDER BY distance_meters ASC NULLS LAST, relevance_tier ASC, calculated_sort_score DESC NULLS LAST, p.google_place_id ASC'
         );
    ELSIF _sort_by = 'name' THEN
         -- Sort by name only
         v_order_by_clause := format(
            'ORDER BY p.name %s NULLS LAST, p.google_place_id ASC',
            CASE WHEN _sort_direction = 'asc' THEN 'ASC' ELSE 'DESC' END
         );
    ELSE -- Default to 'overall_score' or any other case (sort by relevance then score)
        v_order_by_clause := format(
            'ORDER BY relevance_tier ASC, calculated_sort_score DESC NULLS %s, p.google_place_id ASC',
            CASE WHEN _sort_direction = 'asc' THEN 'FIRST' ELSE 'LAST' END -- Ensure NULL scores are last when sorting DESC
        );
    END IF;

    -- Base query structure with CTE (Corrected quoting inside format string)
    RETURN QUERY EXECUTE format(' 
        WITH RelevantPraxis AS ( -- Renamed CTE for clarity
            SELECT 
                p.google_place_id,
                -- Calculate Relevance Tier
                CASE
                    WHEN p.category = ''Hautarzt'' OR p.subtypes @> ARRAY[''Hautarzt'', ''Allergologe'', ''Venerologe'', ''Kinderdermatologe'']::text[] THEN 1
                    WHEN p.category IN (''Hausarzt'', ''Allgemeinmediziner'') OR p.subtypes @> ARRAY[''Hausarzt'', ''Allgemeinmediziner'']::text[] THEN 2
                    ELSE 3
                END as relevance_tier,
                -- Calculate Combined Score (Custom Score > Google Rating*20 > 0)
                COALESCE(pa.overall_score, p.rating * 20, 0) as calculated_sort_score,
                -- Calculate Distance
                (CASE WHEN %3$L IS NOT NULL THEN ST_Distance(p.location::geography, %3$L::geography) ELSE NULL END)::numeric as distance_meters
            FROM praxis p
            LEFT JOIN praxis_analysis pa ON p.google_place_id = pa.praxis_google_place_id 
            %1$s -- Service Join Placeholder
            %2$s -- WHERE Clause Placeholder
        ), TotalCount AS (
           SELECT count(*) as total FROM RelevantPraxis
        )
        SELECT
           tc.total,
           p.google_place_id, p.slug, p.name, p.full_address, p.city,
           p.city_slug,
           p.postal_code,
           p.latitude::numeric, p.longitude::numeric, p.photo, p.booking_appointment_link, p.about,
           p.category, p.subtypes,
           jsonb_build_object( -- Analysis JSON
                ''overall_score'', pa.overall_score,
                ''termin_wartezeit_positiv'', pa.termin_wartezeit_positiv, ''termin_wartezeit_negativ'', pa.termin_wartezeit_negativ,
                ''freundlichkeit_empathie_positiv'', pa.freundlichkeit_empathie_positiv, ''freundlichkeit_empathie_negativ'', pa.freundlichkeit_empathie_negativ,
                ''aufklaerung_vertrauen_positiv'', pa.aufklaerung_vertrauen_positiv, ''aufklaerung_vertrauen_negativ'', pa.aufklaerung_vertrauen_negativ,
                ''kompetenz_behandlung_positiv'', pa.kompetenz_behandlung_positiv, ''kompetenz_behandlung_negativ'', pa.kompetenz_behandlung_negativ,
                ''praxis_ausstattung_positiv'', pa.praxis_ausstattung_positiv, ''praxis_ausstattung_negativ'', pa.praxis_ausstattung_negativ,
                ''zusammenfassung'', pa.zusammenfassung,
                ''tags'', pa.tags,
                ''services'', (SELECT jsonb_agg(s.name) FROM praxis_service ps_agg JOIN service s ON s.id = ps_agg.service_id WHERE ps_agg.praxis_google_place_id = p.google_place_id)
           ) as analysis,
           rp.distance_meters, -- Get distance from CTE
           p.business_status, p.located_in,
           p.reviews
        FROM praxis p
        JOIN RelevantPraxis rp ON p.google_place_id = rp.google_place_id
        CROSS JOIN TotalCount tc
        LEFT JOIN praxis_analysis pa ON p.google_place_id = pa.praxis_google_place_id -- Join again for analysis JSON
        %4$s -- ORDER BY Clause Placeholder
        LIMIT %5$L OFFSET %6$L;
        ', 
        v_join_services_clause, -- %1$s
        v_final_where_clause,   -- %2$s
        _origin,                -- %3$L 
        v_order_by_clause,      -- %4$s (Pass the constructed ORDER BY clause)
        _page_size,             -- %5$L
        _offset                 -- %6$L
    );

END;$function$ 