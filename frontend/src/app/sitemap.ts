import { MetadataRoute } from 'next';
// Import Supabase client (using direct initialization as in page.tsx)
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Define the base URL for your site - IMPORTANT: Replace with your production URL
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.hautarzt-vergleich.de'; // Fallback needed

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    console.log('[sitemap.ts] Generating sitemap...');

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[sitemap.ts] Supabase URL or Anon Key missing.");
        return []; // Return empty if config missing
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Static Pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: `${BASE_URL}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/leistungen`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/kontakt`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/impressum`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/datenschutz`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    // 2. City Pages (/hautarzt/[stadtSlug])
    let cityPages: MetadataRoute.Sitemap = [];
    try {
        // Fetch all non-null, non-empty city slugs
        const { data: cityData, error: cityError } = await supabase
            .from('praxis')
            .select('city_slug') // Select only the slug
            .not('city_slug', 'is', null)
            .neq('city_slug', '');
        // Removed .group('city_slug'); 

        if (cityError) throw cityError;

        // Get unique slugs using Set
        const uniqueCitySlugs = new Set((cityData || []).map(c => c.city_slug));

        // Map unique slugs to sitemap entries
        cityPages = Array.from(uniqueCitySlugs).map((slug) => ({
            url: `${BASE_URL}/hautarzt/${slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        }));
        console.log(`[sitemap.ts] Found ${cityPages.length} unique city pages.`);
    } catch (error) {
        console.error("[sitemap.ts] Error fetching city slugs:", error);
    }

    // 3. Praxis Detail Pages (/hautarzt/[stadtSlug]/[praxisSlug])
    let praxisPages: MetadataRoute.Sitemap = [];
    try {
        // Fetch slugs for active practices only
        const { data: praxen, error: praxisError } = await supabase
            .from('praxis')
            .select('city_slug, slug, updated_at') // Include updated_at if available
            .not('slug', 'is', null)
            .neq('slug', '')
            .not('city_slug', 'is', null)
            .neq('city_slug', '')
            .eq('business_status', 'OPERATIONAL'); // Example: Only include operational ones
        // Potentially add .eq('analysis_status', 'completed') if desired

        if (praxisError) throw praxisError;

        praxisPages = (praxen || []).map((praxis) => ({
            url: `${BASE_URL}/hautarzt/${praxis.city_slug}/${praxis.slug}`,
            lastModified: praxis.updated_at ? new Date(praxis.updated_at) : new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        }));
        console.log(`[sitemap.ts] Found ${praxisPages.length} praxis pages.`);
    } catch (error) {
        console.error("[sitemap.ts] Error fetching praxis slugs:", error);
    }

    // 4. Service Detail Pages (/leistungen/[slug])
    let servicePages: MetadataRoute.Sitemap = [];
    try {
        // Read slugs from filenames in the content directory
        const contentDirectory = path.join(process.cwd(), 'content/services');
        console.log(`[sitemap.ts] Reading services from: ${contentDirectory}`); // Add log for corrected path
        const filenames = fs.readdirSync(contentDirectory);

        servicePages = filenames
            .filter(filename => filename.endsWith('.md')) // Only process markdown files
            .map(filename => {
                const slug = filename.replace(/\.md$/, '');
                // Optional: Read frontmatter to get lastModified date if available?
                // For now, using current date.
                return {
                    url: `${BASE_URL}/leistungen/${slug}`,
                    lastModified: new Date(), // TODO: Get last mod date from file system or frontmatter?
                    changeFrequency: 'monthly',
                    priority: 0.7,
                };
            });
        console.log(`[sitemap.ts] Found ${servicePages.length} service pages from files.`);
    } catch (error) {
        console.error("[sitemap.ts] Error reading service files:", error);
        // Check if the directory exists
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            // Log the corrected path in the error message as well
            console.error(`[sitemap.ts] Directory not found: ${path.join(process.cwd(), 'content/services')}`);
        }
    }

    // Combine all URLs
    const allUrls = [
        ...staticPages,
        ...cityPages,
        ...praxisPages,
        ...servicePages,
    ];

    console.log(`[sitemap.ts] Generated total ${allUrls.length} URLs.`);
    return allUrls;
} 