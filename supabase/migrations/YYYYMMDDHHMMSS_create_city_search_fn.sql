-- Function to efficiently find distinct city/slug pairs matching a prefix
CREATE OR REPLACE FUNCTION public.search_distinct_cities_by_prefix(
    prefix text,
    query_limit integer DEFAULT 6
)
RETURNS TABLE(city text, city_slug text)
LANGUAGE sql
STABLE -- Indicates the function cannot modify the database and always returns the same results for the same arguments within a single transaction
AS $$
    SELECT DISTINCT 
        p.city, 
        p.city_slug
    FROM public.praxis p
    WHERE 
        p.city_normalized LIKE lower(unaccent(prefix)) || '%'
        AND p.city_slug IS NOT NULL
        AND p.city_slug <> ''
        AND p.business_status <> 'CLOSED_PERMANENTLY'
    ORDER BY
        -- Optional: Add better ordering, e.g., based on review count or score?
        p.city ASC, p.city_slug ASC
    LIMIT query_limit;
$$; 