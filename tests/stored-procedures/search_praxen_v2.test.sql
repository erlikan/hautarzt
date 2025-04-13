-- tests/stored-procedures/search_praxen_v2.test.sql

-- Test setup
-- Create temporary test data (using random UUIDs to avoid conflicts)
DO $$
DECLARE
  test_place_id_1 TEXT := 'test_' || gen_random_uuid();
  test_place_id_2 TEXT := 'test_' || gen_random_uuid();
  test_place_id_3 TEXT := 'test_' || gen_random_uuid();
  test_service_id_1 INTEGER;
  test_service_id_2 INTEGER;
BEGIN
  -- Insert test practices
  INSERT INTO praxis (
    google_place_id, name, full_address, city, postal_code, 
    latitude, longitude, location, rating, reviews, 
    photo, analysis_status
  ) VALUES
  (
    test_place_id_1, 'Test Hautarzt Berlin', 'Teststraße 1, 10115 Berlin', 'Berlin', '10115',
    52.52, 13.40, ST_SetSRID(ST_MakePoint(13.40, 52.52), 4326), 4.5, 50,
    'https://example.com/photo1.jpg', 'completed'
  ),
  (
    test_place_id_2, 'Test Dermatologie München', 'Hauptstraße 10, 80333 München', 'München', '80333',
    48.14, 11.58, ST_SetSRID(ST_MakePoint(11.58, 48.14), 4326), 4.0, 30,
    'https://example.com/photo2.jpg', 'completed'
  ),
  (
    test_place_id_3, 'Test Hautarzt Berlin-Mitte', 'Friedrichstraße 100, 10117 Berlin', 'Berlin', '10117',
    52.51, 13.39, ST_SetSRID(ST_MakePoint(13.39, 52.51), 4326), 3.5, 20,
    'https://example.com/photo3.jpg', 'completed'
  );

  -- Insert test analysis data
  INSERT INTO praxis_analysis (
    praxis_google_place_id, overall_score,
    termin_wartezeit_positiv, termin_wartezeit_neutral, termin_wartezeit_negativ,
    freundlichkeit_empathie_positiv, freundlichkeit_empathie_neutral, freundlichkeit_empathie_negativ,
    aufklaerung_vertrauen_positiv, aufklaerung_vertrauen_neutral, aufklaerung_vertrauen_negativ,
    kompetenz_behandlung_positiv, kompetenz_behandlung_neutral, kompetenz_behandlung_negativ,
    praxis_ausstattung_positiv, praxis_ausstattung_neutral, praxis_ausstattung_negativ,
    tags, staerken, schwaechen, zusammenfassung
  ) VALUES
  (
    test_place_id_1, 4.3,
    0.6, 0.3, 0.1,
    0.7, 0.2, 0.1,
    0.8, 0.1, 0.1,
    0.9, 0.05, 0.05,
    0.5, 0.3, 0.2,
    ARRAY['freundlich', 'kompetent'], ARRAY['Kompetenz', 'Beratung'], ARRAY['Wartezeit'], 'Sehr guter Arzt'
  ),
  (
    test_place_id_2, 3.8,
    0.4, 0.3, 0.3,
    0.6, 0.3, 0.1,
    0.7, 0.2, 0.1,
    0.8, 0.1, 0.1,
    0.6, 0.2, 0.2,
    ARRAY['modern', 'gründlich'], ARRAY['Ausstattung'], ARRAY['Wartezeit'], 'Gute Praxis mit modernem Equipment'
  ),
  (
    test_place_id_3, 3.2,
    0.3, 0.4, 0.3,
    0.5, 0.3, 0.2,
    0.6, 0.2, 0.2,
    0.7, 0.2, 0.1,
    0.4, 0.3, 0.3,
    ARRAY['zentral'], ARRAY['Lage'], ARRAY['Wartezeit', 'Personal'], 'Zentral gelegen, durchschnittliche Bewertungen'
  );

  -- Insert test services
  INSERT INTO service (name) 
  VALUES ('Akne-Behandlung') 
  RETURNING id INTO test_service_id_1;
  
  INSERT INTO service (name) 
  VALUES ('Hautkrebsvorsorge') 
  RETURNING id INTO test_service_id_2;

  -- Link services to practices
  INSERT INTO praxis_service (praxis_google_place_id, service_id)
  VALUES
  (test_place_id_1, test_service_id_1),
  (test_place_id_1, test_service_id_2),
  (test_place_id_2, test_service_id_2),
  (test_place_id_3, test_service_id_1);

  -- TEST 1: Basic search by city
  DO $$
  DECLARE
    result JSON;
  BEGIN
    SELECT search_praxen_v2(p_city := 'Berlin') INTO result;
    
    -- Check if we got 2 results (the Berlin practices)
    ASSERT (result->>'total_count')::INTEGER = 2, 
           'Expected 2 results for Berlin search, got ' || (result->>'total_count')::INTEGER;
    
    -- Check first item is the highest rated Berlin practice
    ASSERT (result->'items'->0->>'google_place_id') = test_place_id_1,
           'First result should be Test Hautarzt Berlin';
    
    -- Check sorting (should be by score, descending by default)
    ASSERT (result->'items'->0->>'overall_score')::FLOAT > (result->'items'->1->>'overall_score')::FLOAT,
           'Results should be sorted by score descending';
           
    RAISE NOTICE 'TEST 1 PASSED: Basic search by city works correctly';
  END $$;

  -- TEST 2: Search with services filter
  DO $$
  DECLARE
    result JSON;
  BEGIN
    SELECT search_praxen_v2(
      p_services := ARRAY['Akne-Behandlung']
    ) INTO result;
    
    -- Check if we got 2 results (practices offering Akne-Behandlung)
    ASSERT (result->>'total_count')::INTEGER = 2, 
           'Expected 2 results for Akne-Behandlung service, got ' || (result->>'total_count')::INTEGER;
           
    RAISE NOTICE 'TEST 2 PASSED: Search with services filter works correctly';
  END $$;

  -- TEST 3: Geo search with radius
  DO $$
  DECLARE
    result JSON;
  BEGIN
    -- Search around Berlin Alexanderplatz with 5km radius
    SELECT search_praxen_v2(
      p_latitude := 52.520,
      p_longitude := 13.405,
      p_radius := 5
    ) INTO result;
    
    -- Both Berlin practices should be within radius
    ASSERT (result->>'total_count')::INTEGER = 2, 
           'Expected 2 results for 5km radius from Alexanderplatz, got ' || (result->>'total_count')::INTEGER;
           
    -- Test with smaller radius (1km)
    SELECT search_praxen_v2(
      p_latitude := 52.520,
      p_longitude := 13.405,
      p_radius := 1
    ) INTO result;
    
    -- Should get fewer results with smaller radius
    ASSERT (result->>'total_count')::INTEGER < 2, 
           'Expected fewer than 2 results for 1km radius search';
           
    RAISE NOTICE 'TEST 3 PASSED: Geo search with radius works correctly';
  END $$;

  -- TEST 4: Score filter
  DO $$
  DECLARE
    result JSON;
  BEGIN
    SELECT search_praxen_v2(
      p_min_score := 4.0
    ) INTO result;
    
    -- Should get 2 practices with score >= 4.0
    ASSERT (result->>'total_count')::INTEGER = 2, 
           'Expected 2 results for min_score=4.0, got ' || (result->>'total_count')::INTEGER;
    
    -- Check all results have score >= 4.0
    ASSERT (result->'items'->0->>'overall_score')::FLOAT >= 4.0 AND
           (result->'items'->1->>'overall_score')::FLOAT >= 4.0,
           'All results should have score >= 4.0';
           
    RAISE NOTICE 'TEST 4 PASSED: Score filtering works correctly';
  END $$;

  -- TEST 5: Pagination
  DO $$
  DECLARE
    result JSON;
  BEGIN
    -- Get page 1 with size 1
    SELECT search_praxen_v2(
      p_page := 1,
      p_page_size := 1
    ) INTO result;
    
    -- Should have total_count = 3 but only 1 item
    ASSERT (result->>'total_count')::INTEGER = 3, 
           'Expected total_count=3, got ' || (result->>'total_count')::INTEGER;
    ASSERT jsonb_array_length(result->'items') = 1,
           'Expected 1 item per page, got ' || jsonb_array_length(result->'items');
    
    -- Get page 2 with size 1
    SELECT search_praxen_v2(
      p_page := 2,
      p_page_size := 1
    ) INTO result;
    
    -- Should have different item than page 1
    ASSERT jsonb_array_length(result->'items') = 1,
           'Expected 1 item on page 2, got ' || jsonb_array_length(result->'items');
           
    RAISE NOTICE 'TEST 5 PASSED: Pagination works correctly';
  END $$;

  -- TEST 6: Sorting options
  DO $$
  DECLARE
    result JSON;
  BEGIN
    -- Sort by name ascending
    SELECT search_praxen_v2(
      p_sort_by := 'name',
      p_sort_direction := 'asc'
    ) INTO result;
    
    -- Check ordering
    ASSERT (result->'items'->0->>'name') < (result->'items'->1->>'name') AND
           (result->'items'->1->>'name') < (result->'items'->2->>'name'),
           'Results should be sorted by name ascending';
    
    -- Sort by score ascending
    SELECT search_praxen_v2(
      p_sort_by := 'score',
      p_sort_direction := 'asc'
    ) INTO result;
    
    -- Check ordering
    ASSERT (result->'items'->0->>'overall_score')::FLOAT < (result->'items'->1->>'overall_score')::FLOAT AND
           (result->'items'->1->>'overall_score')::FLOAT < (result->'items'->2->>'overall_score')::FLOAT,
           'Results should be sorted by score ascending';
           
    RAISE NOTICE 'TEST 6 PASSED: Sorting options work correctly';
  END $$;

  -- Clean up test data
  DELETE FROM praxis_service WHERE praxis_google_place_id IN (test_place_id_1, test_place_id_2, test_place_id_3);
  DELETE FROM praxis_analysis WHERE praxis_google_place_id IN (test_place_id_1, test_place_id_2, test_place_id_3);
  DELETE FROM praxis WHERE google_place_id IN (test_place_id_1, test_place_id_2, test_place_id_3);
  DELETE FROM service WHERE id IN (test_service_id_1, test_service_id_2);
  
  RAISE NOTICE 'All tests completed. Test data cleaned up.';
END $$; 