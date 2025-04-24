-- Consolidate services and update relevance flags

-- Merge Hautkrebs-Screening (107) into Hautkrebsscreening (20)
-- Step 1.1: Remove duplicate links for 107 if 20 exists for the same praxis
DELETE FROM praxis_service ps_del
WHERE ps_del.service_id = 107
  AND EXISTS (
    SELECT 1
    FROM praxis_service ps_exists
    WHERE ps_exists.praxis_google_place_id = ps_del.praxis_google_place_id
      AND ps_exists.service_id = 20
  );

-- Step 1.2: Update remaining links from 107 to 20
UPDATE praxis_service
SET service_id = 20
WHERE service_id = 107;

-- Step 1.3: Delete the old service 'Hautkrebs-Screening' (107)
DELETE FROM service
WHERE id = 107;

-- Merge Besenreißer veröden (85) into Besenreiser veröden (32)
-- Step 2.1: Remove duplicate links for 85 if 32 exists for the same praxis
DELETE FROM praxis_service ps_del
WHERE ps_del.service_id = 85
  AND EXISTS (
    SELECT 1
    FROM praxis_service ps_exists
    WHERE ps_exists.praxis_google_place_id = ps_del.praxis_google_place_id
      AND ps_exists.service_id = 32
  );

-- Step 2.2: Update remaining links from 85 to 32
UPDATE praxis_service
SET service_id = 32
WHERE service_id = 85;

-- Step 2.3: Delete the old service 'Besenreißer veröden' (85)
DELETE FROM service
WHERE id = 85;


-- Step 3: Update relevance flag for specified services (set to FALSE)
UPDATE service
SET is_relevant_dermatology = false
WHERE id IN (
  162, -- Abstrich
  189, -- Fußpflege
  151, -- Lymphdrainage
  2495, -- psychische Beschwerden
  153, -- Schulmedizin
  2630  -- Zeckenbiss
);
