-- search_praxen_v2.sql

-- Create stored procedure for comprehensive search with filtering, sorting, and pagination
CREATE OR REPLACE FUNCTION search_praxen_v2(
  p_query TEXT DEFAULT NULL,            -- Text search query
  p_city TEXT DEFAULT NULL,             -- Filter by city name
  p_postal_code TEXT DEFAULT NULL,      -- Filter by postal code
  p_latitude FLOAT DEFAULT NULL,        -- For geo search
  p_longitude FLOAT DEFAULT NULL,       -- For geo search
  p_radius FLOAT DEFAULT 10,            -- Search radius in km, default 10km
  p_min_score FLOAT DEFAULT NULL,       -- Minimum score filter
  p_max_score FLOAT DEFAULT NULL,       -- Maximum score filter
  p_services TEXT[] DEFAULT NULL,       -- Filter by services offered
  p_sort_by TEXT DEFAULT 'score',       -- Sort by: 'score', 'distance', 'name'
  p_sort_direction TEXT DEFAULT 'desc', -- Sort direction: 'asc', 'desc'
  p_page INTEGER DEFAULT 1,             -- Page number, starting from 1
  p_page_size INTEGER DEFAULT 20        -- Results per page
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Use with caution, ensure secure parameter validation
AS $$
DECLARE
  v_where_conditions TEXT[] := '{}';
  v_where_clause TEXT := '';
  v_order_by_clause TEXT := '';
  v_sql TEXT;
  v_count_sql TEXT;
  v_total_count INTEGER;
  v_result JSON;
  v_items JSON;
  v_final_result JSON;
BEGIN
  -- Convert radius from km to meters for ST_DWithin
  p_radius := p_radius * 1000;
  
  -- Build WHERE conditions
  -- Text search
  IF p_query IS NOT NULL THEN
    v_where_conditions := array_append(v_where_conditions, 
      $sql$p.name ILIKE '%' || $1 || '%' OR p.adresse ILIKE '%' || $1 || '%'$sql$);
  END IF;

  -- City filter
  IF p_city IS NOT NULL THEN
    v_where_conditions := array_append(v_where_conditions, 
      $sql$p.city ILIKE '%' || $2 || '%'$sql$);
  END IF;

  -- Postal code filter
  IF p_postal_code IS NOT NULL THEN
    v_where_conditions := array_append(v_where_conditions, 
      $sql$p.postal_code = $3$sql$);
  END IF;

  -- Geographic search if both lat and lon are provided
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_where_conditions := array_append(v_where_conditions, 
      $sql$p.location IS NOT NULL AND ST_DWithin(
        p.location::geography, 
        ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, 
        $6
      )$sql$);
  END IF;

  -- Score filters
  IF p_min_score IS NOT NULL THEN
    v_where_conditions := array_append(v_where_conditions, 
      $sql$pa.overall_score >= $7$sql$);
  END IF;

  IF p_max_score IS NOT NULL THEN
    v_where_conditions := array_append(v_where_conditions, 
      $sql$pa.overall_score <= $8$sql$);
  END IF;

  -- Services filter
  IF p_services IS NOT NULL AND array_length(p_services, 1) > 0 THEN
    v_where_conditions := array_append(v_where_conditions, 
      $sql$EXISTS (
        SELECT 1 FROM praxis_service ps
        JOIN service s ON ps.service_id = s.id
        WHERE ps.praxis_google_place_id = p.google_place_id
        AND s.name = ANY($9)
      )$sql$);
  END IF;

  -- Build final WHERE clause
  IF array_length(v_where_conditions, 1) > 0 THEN
    v_where_clause := 'WHERE ' || array_to_string(v_where_conditions, ' AND ');
  END IF;

  -- Build ORDER BY clause
  CASE 
    WHEN p_sort_by = 'distance' AND p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
      v_order_by_clause := $sql$
        ORDER BY ST_Distance(
          p.location::geography, 
          ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography
        ) $sql$ || p_sort_direction;
    WHEN p_sort_by = 'name' THEN
      v_order_by_clause := 'ORDER BY p.name ' || p_sort_direction;
    ELSE -- Default to score
      v_order_by_clause := 'ORDER BY pa.overall_score ' || p_sort_direction || ' NULLS LAST';
  END CASE;

  -- Count total items before pagination
  v_count_sql := $sql$
    SELECT COUNT(DISTINCT p.google_place_id) 
    FROM praxis p
    LEFT JOIN praxis_analysis pa ON p.google_place_id = pa.praxis_google_place_id
  $sql$ || v_where_clause;
  
  EXECUTE v_count_sql 
  USING 
    p_query, 
    p_city, 
    p_postal_code, 
    p_longitude, -- Note: Longitude first, Latitude second
    p_latitude, 
    p_radius,
    p_min_score, 
    p_max_score, 
    p_services
  INTO v_total_count;

  -- Build main query with pagination
  v_sql := $sql$
    WITH praxis_data AS (
      SELECT 
        p.google_place_id, 
        p.slug, 
        p.name,
        p.full_address,
        p.city,
        p.postal_code,
        p.latitude,
        p.longitude,
        p.phone,
        p.site,
        p.photo,
        p.rating, 
        p.reviews,
        pa.overall_score,
        pa.termin_wartezeit_positiv,
        pa.termin_wartezeit_neutral,
        pa.termin_wartezeit_negativ,
        pa.freundlichkeit_empathie_positiv,
        pa.freundlichkeit_empathie_neutral,
        pa.freundlichkeit_empathie_negativ,
        pa.aufklaerung_vertrauen_positiv,
        pa.aufklaerung_vertrauen_neutral,
        pa.aufklaerung_vertrauen_negativ,
        pa.kompetenz_behandlung_positiv,
        pa.kompetenz_behandlung_neutral,
        pa.kompetenz_behandlung_negativ,
        pa.praxis_ausstattung_positiv,
        pa.praxis_ausstattung_neutral,
        pa.praxis_ausstattung_negativ,
        pa.tags,
        pa.staerken,
        pa.schwaechen,
        pa.zusammenfassung
  $sql$;
  
  -- Add distance calculation if geographic search
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_sql := v_sql || $sql$,
        ST_Distance(
          p.location::geography, 
          ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography
        ) / 1000 as distance -- convert to km
    $sql$;
  END IF;

  -- Add FROM, WHERE, ORDER BY clauses
  v_sql := v_sql || $sql$
      FROM praxis p
      LEFT JOIN praxis_analysis pa ON p.google_place_id = pa.praxis_google_place_id
  $sql$ || v_where_clause || $sql$
      GROUP BY p.google_place_id, pa.praxis_google_place_id
  $sql$ || v_order_by_clause || $sql$
      LIMIT $10 OFFSET $11
    )
    SELECT json_agg(praxis_data.*) FROM praxis_data
  $sql$;

  -- Execute query
  EXECUTE v_sql 
  USING 
    p_query, 
    p_city, 
    p_postal_code, 
    p_longitude, -- Note: Longitude first, Latitude second
    p_latitude, 
    p_radius,
    p_min_score, 
    p_max_score, 
    p_services,
    p_page_size, 
    (p_page - 1) * p_page_size
  INTO v_items;

  -- Build final result
  v_final_result := json_build_object(
    'total_count', v_total_count,
    'items', COALESCE(v_items, '[]'::JSON)
  );

  RETURN v_final_result;
END;
$$;

-- Set permissions for the function
GRANT EXECUTE ON FUNCTION search_praxen_v2 TO anon, authenticated, service_role; 