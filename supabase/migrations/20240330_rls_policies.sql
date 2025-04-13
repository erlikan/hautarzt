-- Enable Row Level Security for tables
ALTER TABLE praxis ENABLE ROW LEVEL SECURITY;
ALTER TABLE praxis_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE service ENABLE ROW LEVEL SECURITY;
ALTER TABLE praxis_service ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for read access to praxis table
CREATE POLICY praxis_select_policy ON praxis
    FOR SELECT
    TO anon, authenticated
    USING (true);  -- Allow anyone to read praxis data

-- Add RLS policies for read access to praxis_analysis table
CREATE POLICY praxis_analysis_select_policy ON praxis_analysis
    FOR SELECT
    TO anon, authenticated
    USING (true);  -- Allow anyone to read analysis data

-- Add RLS policies for read access to service table (mentioned as TO-DO in doc)
CREATE POLICY service_select_policy ON service
    FOR SELECT
    TO anon, authenticated
    USING (true);  -- Allow anyone to read service data

-- Add RLS policies for read access to praxis_service table
CREATE POLICY praxis_service_select_policy ON praxis_service
    FOR SELECT
    TO anon, authenticated
    USING (true);  -- Allow anyone to read praxis-service mappings

-- For non-select operations, restrict access to service_role only
-- This ensures only our backend can modify the data

-- For praxis table
CREATE POLICY praxis_insert_policy ON praxis
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY praxis_update_policy ON praxis
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY praxis_delete_policy ON praxis
    FOR DELETE
    TO service_role
    USING (true);

-- For praxis_analysis table
CREATE POLICY praxis_analysis_insert_policy ON praxis_analysis
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY praxis_analysis_update_policy ON praxis_analysis
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY praxis_analysis_delete_policy ON praxis_analysis
    FOR DELETE
    TO service_role
    USING (true);

-- For service table
CREATE POLICY service_insert_policy ON service
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY service_update_policy ON service
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY service_delete_policy ON service
    FOR DELETE
    TO service_role
    USING (true);

-- For praxis_service table
CREATE POLICY praxis_service_insert_policy ON praxis_service
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY praxis_service_update_policy ON praxis_service
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY praxis_service_delete_policy ON praxis_service
    FOR DELETE
    TO service_role
    USING (true); 