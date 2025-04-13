-- Create the 'stadt' table for storing city information
CREATE TABLE IF NOT EXISTS public.stadt (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookup by slug
CREATE INDEX IF NOT EXISTS idx_stadt_slug ON public.stadt (slug);

-- Create RLS policies
ALTER TABLE public.stadt ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY stadt_select_policy ON public.stadt
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Only service role can modify
CREATE POLICY stadt_insert_policy ON public.stadt
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY stadt_update_policy ON public.stadt
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY stadt_delete_policy ON public.stadt
    FOR DELETE
    TO service_role
    USING (true);

-- Add some sample cities
INSERT INTO public.stadt (name, slug) VALUES
('Berlin', 'berlin'),
('München', 'muenchen'),
('Hamburg', 'hamburg'),
('Köln', 'koeln'),
('Frankfurt', 'frankfurt'),
('Stuttgart', 'stuttgart'),
('Düsseldorf', 'duesseldorf'),
('Dortmund', 'dortmund'),
('Essen', 'essen'),
('Leipzig', 'leipzig'),
('Bremen', 'bremen'),
('Dresden', 'dresden'),
('Hannover', 'hannover'),
('Nürnberg', 'nuernberg'),
('Duisburg', 'duisburg'),
('Bochum', 'bochum'),
('Wuppertal', 'wuppertal'),
('Bielefeld', 'bielefeld'),
('Bonn', 'bonn'),
('Münster', 'muenster'),
('Karlsruhe', 'karlsruhe'),
('Mannheim', 'mannheim'),
('Augsburg', 'augsburg'),
('Wiesbaden', 'wiesbaden'),
('Gelsenkirchen', 'gelsenkirchen'),
('Mönchengladbach', 'moenchengladbach'),
('Braunschweig', 'braunschweig'),
('Chemnitz', 'chemnitz'),
('Kiel', 'kiel'),
('Aachen', 'aachen'),
('Halle', 'halle'),
('Magdeburg', 'magdeburg'),
('Freiburg', 'freiburg'),
('Krefeld', 'krefeld'),
('Lübeck', 'luebeck'),
('Oberhausen', 'oberhausen'),
('Erfurt', 'erfurt'),
('Mainz', 'mainz'),
('Rostock', 'rostock'),
('Kassel', 'kassel'),
('Hagen', 'hagen'),
('Hamm', 'hamm'),
('Saarbrücken', 'saarbruecken'),
('Mülheim an der Ruhr', 'muelheim-an-der-ruhr'),
('Potsdam', 'potsdam'),
('Ludwigshafen am Rhein', 'ludwigshafen-am-rhein'),
('Oldenburg', 'oldenburg'),
('Leverkusen', 'leverkusen'),
('Darmstadt', 'darmstadt');

-- Notify application of table creation
NOTIFY pgrst, 'reload schema'; 