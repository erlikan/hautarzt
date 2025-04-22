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
    integer,
    text
);

-- Now create the function with the new return signature and sorting logic
CREATE OR REPLACE FUNCTION public.search_praxen(
    _context_city_slug text DEFAULT NULL::text,
    _filter_postal_code text DEFAULT NULL::text,
    _filter_service_ids integer[] DEFAULT NULL::integer[],
    _filter_min_score numeric DEFAULT NULL::numeric,
    _geo_lat numeric DEFAULT NULL::numeric,
    _geo_lon numeric DEFAULT NULL::numeric,
    _geo_radius_meters integer DEFAULT 10000,
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
    category text,
    subtypes text[],
    analysis jsonb,
    distance_meters numeric,
    business_status text,
    located_in text,
    reviews integer,
    calculated_sort_score numeric,
    score_availability_tier integer
)
 LANGUAGE plpgsql
AS $function$
DECLARE
    _origin GEOGRAPHY;
    v_where_conditions TEXT[] := ARRAY['p.business_status != ''CLOSED_PERMANENTLY'''];
    v_join_services_clause TEXT := '';
    v_final_where_clause TEXT;
    v_order_by_clause TEXT;
    v_has_primary_context BOOLEAN := FALSE; -- Flag to track if a specific context is set
BEGIN
    -- 1. Determine Origin Point & Primary Context
    IF _geo_lat IS NOT NULL AND _geo_lon IS NOT NULL THEN
        _origin := ST_SetSRID(ST_MakePoint(_geo_lon, _geo_lat), 4326);
        v_has_primary_context := TRUE;
        v_where_conditions := array_append(v_where_conditions, format('p.location IS NOT NULL AND ST_DWithin(p.location::geography, %L::geography, %L)', _origin, _geo_radius_meters));
    ELSE
        _origin := NULL;
    END IF;

    IF _context_city_slug IS NOT NULL THEN
        v_where_conditions := array_append(v_where_conditions, format('p.city_slug = %L', _context_city_slug));
        v_has_primary_context := TRUE;
    END IF;
    IF _filter_postal_code IS NOT NULL THEN
        v_where_conditions := array_append(v_where_conditions, format('p.postal_code = %L', _filter_postal_code));
        v_has_primary_context := TRUE;
    END IF;

    -- Secondary Filters 
    IF _filter_min_score IS NOT NULL THEN
        v_where_conditions := array_append(v_where_conditions, format('subq.calculated_sort_score >= %L', _filter_min_score));
    END IF;
    IF _filter_service_ids IS NOT NULL AND array_length(_filter_service_ids, 1) > 0 THEN
        v_where_conditions := array_append(v_where_conditions, format(
            'EXISTS (SELECT 1 FROM praxis_service ps_filter WHERE ps_filter.praxis_google_place_id = p.google_place_id AND ps_filter.service_id = ANY(%L::int[]))',
             _filter_service_ids
        ));
    END IF;

    -- Final WHERE clause construction - MUST have primary context now
    IF v_has_primary_context THEN
        v_final_where_clause := ' WHERE ' || array_to_string(v_where_conditions, ' AND ');
    ELSE
      -- If no city, no plz, no geo context, return nothing
      v_final_where_clause := ' WHERE FALSE ';
    END IF;

    -- Determine ORDER BY clause (logic remains same)
    IF _sort_by = 'distance' AND _origin IS NOT NULL THEN
         v_order_by_clause := 'ORDER BY distance_meters ASC NULLS LAST, relevance_tier ASC, score_availability_tier ASC, calculated_sort_score DESC NULLS LAST, google_place_id ASC';
    ELSIF _sort_by = 'name' THEN
         v_order_by_clause := format('ORDER BY name %s NULLS LAST, google_place_id ASC', CASE WHEN _sort_direction = 'asc' THEN 'ASC' ELSE 'DESC' END);
    ELSE -- Default score sort
        v_order_by_clause := 'ORDER BY relevance_tier ASC, score_availability_tier ASC, calculated_sort_score DESC NULLS LAST, google_place_id ASC';
    END IF;
    
    -- Final Query Structure (Simplified approach from before)
    -- Construct the final SQL using subquery for calculations
    RETURN QUERY EXECUTE format('
        WITH QueryResult AS (
            SELECT
                p.*, pa.*, -- Select all from both base tables
                CASE -- relevance_tier
                    WHEN p.category = ''Hautarzt'' OR p.subtypes @> ARRAY[''Hautarzt'', ''Allergologe'', ''Venerologe'', ''Kinderdermatologe'']::text[] THEN 1
                    WHEN p.category IN (''Hausarzt'', ''Allgemeinmediziner'') OR p.subtypes @> ARRAY[''Hausarzt'', ''Allgemeinmediziner'']::text[] THEN 2
                    ELSE 3
                END as relevance_tier,
                CASE -- score_availability_tier
                    WHEN pa.overall_score IS NOT NULL THEN 1 
                    WHEN p.rating IS NOT NULL AND p.reviews IS NOT NULL AND p.reviews > 0 THEN 2
                    ELSE 3
                END as score_availability_tier,
                COALESCE( -- calculated_sort_score
                    pa.overall_score,
                    CASE WHEN p.reviews IS NOT NULL AND p.reviews > 0 THEN
                        ( (5.0 * COALESCE(p.reviews_per_score_5, 0)) + (4.0 * COALESCE(p.reviews_per_score_4, 0)) + (3.0 * COALESCE(p.reviews_per_score_3, 0)) + (2.0 * COALESCE(p.reviews_per_score_2, 0)) + (1.0 * COALESCE(p.reviews_per_score_1, 0)) ) * 20.0 / p.reviews
                    ELSE 0 END,
                    0
                )::numeric as calculated_sort_score,
                (CASE WHEN %L IS NOT NULL THEN ST_Distance(p.location::geography, %L::geography) ELSE NULL END)::numeric as distance_meters
            FROM praxis p
            LEFT JOIN praxis_analysis pa ON p.google_place_id = pa.praxis_google_place_id
            -- Apply join for service filter here if needed by WHERE clause
            %s 
        ),
        FilteredResult AS (
            SELECT *, COUNT(*) OVER() as total
            FROM QueryResult subq -- Alias for subquery
            %s -- Apply final WHERE clause here
        )
        SELECT
           fr.total,
           fr.google_place_id, fr.slug, fr.name, fr.full_address, fr.city, fr.city_slug, fr.postal_code,
           fr.latitude::numeric, fr.longitude::numeric, fr.photo, fr.booking_appointment_link, fr.about,
           fr.category, fr.subtypes,
           jsonb_build_object( -- Analysis JSON
                ''overall_score'', fr.overall_score, -- Note: use fr.overall_score from analysis table join
                ''termin_wartezeit_positiv'', fr.termin_wartezeit_positiv, ''termin_wartezeit_negativ'', fr.termin_wartezeit_negativ,
                ''freundlichkeit_empathie_positiv'', fr.freundlichkeit_empathie_positiv, ''freundlichkeit_empathie_negativ'', fr.freundlichkeit_empathie_negativ,
                ''aufklaerung_vertrauen_positiv'', fr.aufklaerung_vertrauen_positiv, ''aufklaerung_vertrauen_negativ'', fr.aufklaerung_vertrauen_negativ,
                ''kompetenz_behandlung_positiv'', fr.kompetenz_behandlung_positiv, ''kompetenz_behandlung_negativ'', fr.kompetenz_behandlung_negativ,
                ''praxis_ausstattung_positiv'', fr.praxis_ausstattung_positiv, ''praxis_ausstattung_negativ'', fr.praxis_ausstattung_negativ,
                ''zusammenfassung'', fr.zusammenfassung,
                ''tags'', fr.tags,
                ''services'', (SELECT jsonb_agg(s.name) FROM praxis_service ps_agg JOIN service s ON s.id = ps_agg.service_id WHERE ps_agg.praxis_google_place_id = fr.google_place_id)
           ) as analysis,
           fr.distance_meters,
           fr.business_status, fr.located_in,
           fr.reviews,
           fr.calculated_sort_score,
           fr.score_availability_tier
        FROM FilteredResult fr
        %s -- ORDER BY Clause
        LIMIT %L OFFSET %L;
        ',
        _origin, -- %L for distance calc (1st)
        _origin, -- %L for distance calc (2nd)
        v_join_services_clause, -- %s for service join
        v_final_where_clause,   -- %s for WHERE clause
        v_order_by_clause,      -- %s ORDER BY
        _page_size,             -- %L LIMIT
        _offset                 -- %L OFFSET
    );
END;$function$ 
