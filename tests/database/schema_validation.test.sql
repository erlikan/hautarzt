-- tests/database/schema_validation.test.sql

-- Schema validation tests
DO $$
DECLARE
  constraint_count INTEGER;
  index_count INTEGER;
  rls_policy_count INTEGER;
  permissions_count INTEGER;
BEGIN
  RAISE NOTICE 'Starting schema validation tests...';

  -- TEST 1: Primary Key constraints
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE c.contype = 'p' -- 'p' means primary key
  AND n.nspname = 'public'
  AND t.relname IN ('praxis', 'praxis_analysis', 'service', 'praxis_service');
  
  ASSERT constraint_count >= 4, 'Missing primary key constraints. Expected at least 4, found ' || constraint_count;
  
  -- Verify specific primary keys
  ASSERT EXISTS(
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'p'
    AND n.nspname = 'public'
    AND t.relname = 'praxis'
    AND a.attname = 'google_place_id'
  ), 'Primary key on praxis.google_place_id is missing';
  
  RAISE NOTICE 'TEST 1 PASSED: Primary Key constraints validated';

  -- TEST 2: Foreign Key constraints
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE c.contype = 'f' -- 'f' means foreign key
  AND n.nspname = 'public'
  AND t.relname IN ('praxis_analysis', 'praxis_service');
  
  ASSERT constraint_count >= 2, 'Missing foreign key constraints. Expected at least 2, found ' || constraint_count;
  
  -- Check ON DELETE CASCADE is set for foreign keys referencing praxis.google_place_id
  ASSERT EXISTS(
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.contype = 'f'
    AND n.nspname = 'public'
    AND t.relname = 'praxis_analysis'
    AND c.confdeltype = 'c' -- 'c' means CASCADE
  ), 'ON DELETE CASCADE not set for praxis_analysis foreign key';
  
  ASSERT EXISTS(
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.contype = 'f'
    AND n.nspname = 'public'
    AND t.relname = 'praxis_service'
    AND c.confdeltype = 'c'
  ), 'ON DELETE CASCADE not set for praxis_service foreign key';
  
  RAISE NOTICE 'TEST 2 PASSED: Foreign Key constraints validated';

  -- TEST 3: UNIQUE constraints
  ASSERT EXISTS(
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'u' -- 'u' means unique constraint
    AND n.nspname = 'public'
    AND t.relname = 'service'
    AND a.attname = 'name'
  ), 'UNIQUE constraint on service.name is missing';
  
  -- Check if there's a UNIQUE constraint on praxis.slug
  ASSERT EXISTS(
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE (c.contype = 'u' OR c.contype = 'p')
    AND n.nspname = 'public'
    AND t.relname = 'praxis'
    AND a.attname = 'slug'
  ), 'UNIQUE constraint on praxis.slug is missing';
  
  RAISE NOTICE 'TEST 3 PASSED: UNIQUE constraints validated';

  -- TEST 4: CHECK constraints (for enum-like fields)
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE c.contype = 'c' -- 'c' means check constraint
  AND n.nspname = 'public'
  AND t.relname IN ('praxis', 'praxis_analysis');
  
  ASSERT constraint_count > 0, 'No CHECK constraints found on praxis or praxis_analysis';
  
  -- Check for specific CHECK constraint on analysis_status
  ASSERT EXISTS(
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.contype = 'c'
    AND n.nspname = 'public'
    AND t.relname = 'praxis'
    AND pg_get_constraintdef(c.oid) LIKE '%analysis_status%'
  ), 'CHECK constraint on praxis.analysis_status is missing';
  
  RAISE NOTICE 'TEST 4 PASSED: CHECK constraints validated';

  -- TEST 5: Indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_index i
  JOIN pg_class idx ON i.indexrelid = idx.oid
  JOIN pg_class tbl ON i.indrelid = tbl.oid
  JOIN pg_namespace n ON tbl.relnamespace = n.oid
  WHERE n.nspname = 'public'
  AND tbl.relname IN ('praxis', 'praxis_analysis', 'service', 'praxis_service')
  AND NOT i.indisprimary -- Exclude primary key indexes
  AND NOT i.indisunique; -- Exclude unique indexes (we already checked them)
  
  ASSERT index_count > 0, 'No non-primary/unique indexes found';
  
  -- Check for specific indexes (btree for city, slug, overall_score, and gist for location)
  ASSERT EXISTS(
    SELECT 1
    FROM pg_index i
    JOIN pg_class idx ON i.indexrelid = idx.oid
    JOIN pg_class tbl ON i.indrelid = tbl.oid
    JOIN pg_namespace n ON tbl.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = tbl.oid AND a.attnum = ANY(i.indkey)
    WHERE n.nspname = 'public'
    AND tbl.relname = 'praxis'
    AND a.attname = 'city'
  ), 'Index on praxis.city is missing';
  
  ASSERT EXISTS(
    SELECT 1
    FROM pg_index i
    JOIN pg_class idx ON i.indexrelid = idx.oid
    JOIN pg_class tbl ON i.indrelid = tbl.oid
    JOIN pg_namespace n ON tbl.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = tbl.oid AND a.attnum = ANY(i.indkey)
    WHERE n.nspname = 'public'
    AND tbl.relname = 'praxis'
    AND a.attname = 'slug'
  ), 'Index on praxis.slug is missing';
  
  ASSERT EXISTS(
    SELECT 1
    FROM pg_index i
    JOIN pg_class idx ON i.indexrelid = idx.oid
    JOIN pg_class tbl ON i.indrelid = tbl.oid
    JOIN pg_namespace n ON tbl.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = tbl.oid AND a.attnum = ANY(i.indkey)
    WHERE n.nspname = 'public'
    AND tbl.relname = 'praxis_analysis'
    AND a.attname = 'overall_score'
  ), 'Index on praxis_analysis.overall_score is missing';
  
  -- Check for GiST index on location
  ASSERT EXISTS(
    SELECT 1
    FROM pg_index i
    JOIN pg_class idx ON i.indexrelid = idx.oid
    JOIN pg_class tbl ON i.indrelid = tbl.oid
    JOIN pg_namespace n ON tbl.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = tbl.oid AND a.attnum = ANY(i.indkey)
    WHERE n.nspname = 'public'
    AND tbl.relname = 'praxis'
    AND a.attname = 'location'
    AND idx.relam = (SELECT oid FROM pg_am WHERE amname = 'gist')
  ), 'GiST index on praxis.location is missing';
  
  RAISE NOTICE 'TEST 5 PASSED: Indexes validated';

  -- TEST 6: Row Level Security (RLS)
  SELECT COUNT(*) INTO rls_policy_count
  FROM pg_policy p
  JOIN pg_class t ON p.polrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public'
  AND t.relname IN ('praxis', 'praxis_analysis', 'service', 'praxis_service');
  
  ASSERT rls_policy_count >= 12, 'Missing RLS policies. Expected at least 12 (1 select + 3 write policies per table), found ' || rls_policy_count;
  
  -- Check if RLS is enabled on all tables
  ASSERT EXISTS(
    SELECT 1
    FROM pg_class t
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
    AND t.relname IN ('praxis', 'praxis_analysis', 'service', 'praxis_service')
    AND t.relrowsecurity = TRUE
  ), 'Row Level Security not enabled on all tables';
  
  -- Check policies for anon/authenticated read access
  ASSERT EXISTS(
    SELECT 1
    FROM pg_policy p
    JOIN pg_class t ON p.polrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
    AND t.relname = 'praxis'
    AND p.polcmd = 'r' -- 'r' means SELECT
    AND p.polpermissive = TRUE
  ), 'SELECT policy for anon/authenticated on praxis is missing';
  
  RAISE NOTICE 'TEST 6 PASSED: Row Level Security policies validated';

  -- TEST 7: Permissions on functions
  SELECT COUNT(*) INTO permissions_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  JOIN pg_type r ON p.prorettype = r.oid
  WHERE n.nspname = 'public'
  AND p.proname IN ('search_praxen_v2', 'save_analysis_data', 'trigger_pending_practice_analyses')
  AND has_function_privilege('anon', p.oid, 'EXECUTE') = TRUE;
  
  ASSERT permissions_count >= 1, 'EXECUTE permission not granted to anon role on functions';
  
  RAISE NOTICE 'TEST 7 PASSED: Function permissions validated';

  RAISE NOTICE 'All schema validation tests completed successfully!';
END $$; 