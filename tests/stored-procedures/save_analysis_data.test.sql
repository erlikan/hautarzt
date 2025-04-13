-- tests/stored-procedures/save_analysis_data.test.sql

-- Test setup
-- Create temporary test data
DO $$
DECLARE
  test_place_id TEXT := 'test_' || gen_random_uuid();
  test_service_id_1 INTEGER;
  test_service_id_2 INTEGER;
  test_service_id_3 INTEGER;
BEGIN
  -- Insert test practice
  INSERT INTO praxis (
    google_place_id, name, full_address, city, postal_code, 
    latitude, longitude, location, rating, reviews, 
    photo, analysis_status
  ) VALUES (
    test_place_id, 'Test Hautarzt', 'Teststraße 1, 10115 Berlin', 'Berlin', '10115',
    52.52, 13.40, ST_SetSRID(ST_MakePoint(13.40, 52.52), 4326), 4.5, 50,
    'https://example.com/photo1.jpg', 'processing'
  );

  -- Insert test services for existing services scenario
  INSERT INTO service (name) 
  VALUES ('Hautkrebsvorsorge') 
  RETURNING id INTO test_service_id_1;
  
  INSERT INTO service (name) 
  VALUES ('Akne-Behandlung') 
  RETURNING id INTO test_service_id_2;

  -- TEST 1: Basic valid analysis data
  DO $$
  DECLARE
    analysis_json JSON := '{
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
      "tags": ["freundlich", "kompetent"],
      "staerken": ["Kompetenz", "Beratung"],
      "schwaechen": ["Wartezeit"],
      "zusammenfassung": "Sehr guter Hautarzt mit ausgezeichneter Beratung, aber teilweise langen Wartezeiten."
    }';
    status TEXT;
  BEGIN
    -- Call the stored procedure
    CALL save_analysis_data(test_place_id, analysis_json);
    
    -- Check analysis data was saved correctly
    ASSERT EXISTS(
      SELECT 1 FROM praxis_analysis 
      WHERE praxis_google_place_id = test_place_id
      AND overall_score = 4.2
      AND tags @> ARRAY['freundlich', 'kompetent']
      AND staerken @> ARRAY['Kompetenz', 'Beratung']
      AND schwaechen @> ARRAY['Wartezeit']
    ), 'Analysis data was not saved correctly';
    
    -- Check practice status was updated
    SELECT analysis_status INTO status FROM praxis WHERE google_place_id = test_place_id;
    ASSERT status = 'completed', 'Praxis status should be "completed", found: ' || status;
    
    RAISE NOTICE 'TEST 1 PASSED: Basic valid analysis data saved correctly';
  END $$;

  -- TEST 2: Analysis data with genannte_leistungen (some new, some existing)
  DO $$
  DECLARE
    analysis_json JSON := '{
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
      "tags": ["freundlich", "kompetent"],
      "genannte_leistungen": ["Hautkrebsvorsorge", "Akne-Behandlung", "Neurodermitis-Behandlung"],
      "staerken": ["Kompetenz", "Beratung"],
      "schwaechen": ["Wartezeit"],
      "zusammenfassung": "Sehr guter Hautarzt mit ausgezeichneter Beratung, aber teilweise langen Wartezeiten."
    }';
    service_count INTEGER;
    new_service_id INTEGER;
  BEGIN
    -- Call the stored procedure
    CALL save_analysis_data(test_place_id, analysis_json);
    
    -- Check if new service was created
    SELECT id INTO new_service_id FROM service WHERE name = 'Neurodermitis-Behandlung';
    ASSERT new_service_id IS NOT NULL, 'New service was not created';
    test_service_id_3 := new_service_id;
    
    -- Check if all services are linked to practice
    SELECT COUNT(*) INTO service_count 
    FROM praxis_service 
    WHERE praxis_google_place_id = test_place_id
    AND service_id IN (test_service_id_1, test_service_id_2, test_service_id_3);
    
    ASSERT service_count = 3, 'Expected 3 services linked to practice, found: ' || service_count;
    
    RAISE NOTICE 'TEST 2 PASSED: Analysis with services correctly handled';
  END $$;

  -- TEST 3: Analysis data with trend attributes
  DO $$
  DECLARE
    analysis_json JSON := '{
      "overall_score": 4.3,
      "termin_wartezeit_positiv": 0.6,
      "termin_wartezeit_neutral": 0.3,
      "termin_wartezeit_negativ": 0.1,
      "termin_wartezeit_trend": "positiv",
      "freundlichkeit_empathie_positiv": 0.7,
      "freundlichkeit_empathie_neutral": 0.2,
      "freundlichkeit_empathie_negativ": 0.1,
      "freundlichkeit_empathie_trend": "neutral",
      "aufklaerung_vertrauen_positiv": 0.8,
      "aufklaerung_vertrauen_neutral": 0.1,
      "aufklaerung_vertrauen_negativ": 0.1,
      "aufklaerung_vertrauen_trend": "positiv",
      "kompetenz_behandlung_positiv": 0.9,
      "kompetenz_behandlung_neutral": 0.05,
      "kompetenz_behandlung_negativ": 0.05,
      "kompetenz_behandlung_trend": "positiv",
      "praxis_ausstattung_positiv": 0.4,
      "praxis_ausstattung_neutral": 0.3,
      "praxis_ausstattung_negativ": 0.3,
      "praxis_ausstattung_trend": "negativ",
      "tags": ["freundlich", "kompetent"],
      "staerken": ["Kompetenz", "Beratung"],
      "schwaechen": ["Ausstattung"],
      "zusammenfassung": "Sehr guter Hautarzt mit ausgezeichneter Beratung."
    }';
    trend_termin TEXT;
    trend_ausstattung TEXT;
  BEGIN
    -- Call the stored procedure
    CALL save_analysis_data(test_place_id, analysis_json);
    
    -- Check if trends were saved
    SELECT termin_wartezeit_trend, praxis_ausstattung_trend 
    INTO trend_termin, trend_ausstattung
    FROM praxis_analysis 
    WHERE praxis_google_place_id = test_place_id;
    
    ASSERT trend_termin = 'positiv', 'Expected termin_wartezeit_trend to be "positiv", found: ' || trend_termin;
    ASSERT trend_ausstattung = 'negativ', 'Expected praxis_ausstattung_trend to be "negativ", found: ' || trend_ausstattung;
    
    RAISE NOTICE 'TEST 3 PASSED: Analysis with trend attributes correctly handled';
  END $$;

  -- TEST 4: Analysis data with missing optional fields
  DO $$
  DECLARE
    analysis_json JSON := '{
      "overall_score": 3.9,
      "termin_wartezeit_positiv": 0.5,
      "termin_wartezeit_neutral": 0.3,
      "termin_wartezeit_negativ": 0.2,
      "freundlichkeit_empathie_positiv": 0.6,
      "freundlichkeit_empathie_neutral": 0.3,
      "freundlichkeit_empathie_negativ": 0.1,
      "aufklaerung_vertrauen_positiv": 0.7,
      "aufklaerung_vertrauen_neutral": 0.2,
      "aufklaerung_vertrauen_negativ": 0.1,
      "kompetenz_behandlung_positiv": 0.8,
      "kompetenz_behandlung_neutral": 0.1,
      "kompetenz_behandlung_negativ": 0.1,
      "praxis_ausstattung_positiv": 0.5,
      "praxis_ausstattung_neutral": 0.3,
      "praxis_ausstattung_negativ": 0.2,
      "zusammenfassung": "Guter Hautarzt mit Stärken in der Behandlung."
    }';
    analysis_record RECORD;
  BEGIN
    -- Call the stored procedure
    CALL save_analysis_data(test_place_id, analysis_json);
    
    -- Check analysis data was saved with default values for missing fields
    SELECT * INTO analysis_record 
    FROM praxis_analysis 
    WHERE praxis_google_place_id = test_place_id;
    
    ASSERT analysis_record.overall_score = 3.9, 'Overall score not saved correctly';
    ASSERT analysis_record.tags IS NULL OR array_length(analysis_record.tags, 1) IS NULL, 
           'Expected tags to be NULL or empty array';
    ASSERT analysis_record.staerken IS NULL OR array_length(analysis_record.staerken, 1) IS NULL, 
           'Expected staerken to be NULL or empty array';
    ASSERT analysis_record.schwaechen IS NULL OR array_length(analysis_record.schwaechen, 1) IS NULL, 
           'Expected schwaechen to be NULL or empty array';
    
    RAISE NOTICE 'TEST 4 PASSED: Analysis with missing optional fields correctly handled';
  END $$;

  -- TEST 5: Error scenario - Malformed JSON
  DO $$
  DECLARE
    analysis_json TEXT := 'This is not valid JSON';
    error_caught BOOLEAN := FALSE;
  BEGIN
    -- Try to call the stored procedure with invalid JSON
    BEGIN
      CALL save_analysis_data(test_place_id, analysis_json::JSON);
    EXCEPTION WHEN OTHERS THEN
      error_caught := TRUE;
    END;
    
    ASSERT error_caught = TRUE, 'Expected error with invalid JSON was not raised';
    
    -- Check practice status remains 'processing' or was set to 'failed'
    ASSERT EXISTS(
      SELECT 1 FROM praxis 
      WHERE google_place_id = test_place_id
      AND (analysis_status = 'processing' OR analysis_status = 'failed')
    ), 'Praxis status should remain "processing" or change to "failed" after error';
    
    RAISE NOTICE 'TEST 5 PASSED: Error handling for invalid JSON works correctly';
  END $$;

  -- Clean up test data
  DELETE FROM praxis_service WHERE praxis_google_place_id = test_place_id;
  DELETE FROM praxis_analysis WHERE praxis_google_place_id = test_place_id;
  DELETE FROM praxis WHERE google_place_id = test_place_id;
  DELETE FROM service WHERE id IN (test_service_id_1, test_service_id_2, test_service_id_3);
  
  RAISE NOTICE 'All tests completed. Test data cleaned up.';
END $$; 