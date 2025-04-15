// Remove 'use client' directive
// import { useState } from 'react'; // Remove client hooks
// import { useRouter } from 'next/navigation'; // Remove client hooks
import Link from 'next/link';
// Remove client-side Shadcn/Lucide imports if not used directly here
// Keep server-side imports like Metadata
import type { Metadata } from 'next';
// Import the new client component
import HomePageClientContent from '@/components/home/HomePageClientContent';
// REMOVE Supabase client import for this page
// import { createClient } from '@supabase/supabase-js'; 
// Import Node.js modules for file system access
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter'; // Library to parse frontmatter
// Import types from central location
import type { FaqItem, ServiceInfoItem } from '@/types'; // Adjust path if needed

// Define types for the data structure we expect from frontmatter
// interface FaqItem { ... }
// interface ServiceInfoItem { ... }

// SEO Metadata - Stays Here
export const metadata: Metadata = {
    title: "Hautarzt Vergleich | Den besten Hautarzt in Ihrer Nähe finden",
    description: "Finden Sie den besten Hautarzt in Ihrer Nähe mit Deutschlands führendem Verzeichnis. Echte Patienteneinblicke zu Wartezeit, Freundlichkeit und Kompetenz. Jetzt Praxis suchen!",
    // Add canonical URL or other metadata as needed later
    // keywords: "Hautarzt, Hautarzt finden, Hautarzt in der Nähe, Dermatologe, Praxisvergleich, Patientenbewertungen", // Optional
};

// Remove constants/types if they are now fully in the client component
// interface CityData { ... }
// const popularCities: CityData[] = [ ... ];
// const faqItems = [ ... ];

// Helper function to read and parse markdown files from a directory
function getContentData<T>(directory: string): T[] {
    const contentDirectory = path.join(process.cwd(), directory);
    console.log(`[getContentData] Attempting to read content from: ${contentDirectory}`);
    try {
        const filenames = fs.readdirSync(contentDirectory);
        console.log(`[getContentData] Found ${filenames.length} files/dirs in ${directory}:`, filenames);

        const items = filenames
            .filter(filename => {
                const isMarkdown = filename.endsWith('.md');
                // console.log(`[getContentData] Checking ${filename}: Is Markdown? ${isMarkdown}`); // Verbose log
                return isMarkdown;
            })
            .map((filename): T => {
                console.log(`[getContentData] Processing file: ${filename}`);
                const slug = filename.replace(/\.md$/, '');
                const filePath = path.join(contentDirectory, filename);
                const fileContents = fs.readFileSync(filePath, 'utf8');
                const { data: frontmatter, content: markdownContent } = matter(fileContents);

                // Log parsed parts for clarity
                console.log(`[getContentData] Parsed ${filename} -> Frontmatter:`, frontmatter);
                console.log(`[getContentData] Parsed ${filename} -> Content:`, markdownContent.substring(0, 50) + '...'); // Log start of content

                let itemData: any = {
                    id: slug,
                    ...frontmatter, // Spread the parsed frontmatter keys (question, title, etc.)
                };

                // Explicitly assign the parsed content to the correct field based on type
                if (directory === 'content/faq') {
                    // Trim whitespace from the content
                    itemData.answer = markdownContent.trim();
                } else if (directory === 'content/services') {
                    // Assign content if needed for service detail pages later
                    // itemData.content = markdownContent; 
                }

                // Ensure required fields exist (example for FaqItem)
                if (directory === 'content/faq' && typeof itemData.question !== 'string') {
                    console.warn(`[getContentData] Missing 'question' in frontmatter for ${filename}`);
                    // Return null or skip if essential data is missing? Decide based on requirements.
                    // For now, let it pass but it might cause issues later.
                }

                return itemData as T; // Cast to generic type T
            });
        console.log(`[getContentData] Successfully processed ${items.length} items from ${directory}.`);
        return items;
    } catch (error) {
        // Log the specific error
        console.error(`[getContentData] Error reading content from ${directory}:`, error);
        return []; // Return empty array on error
    }
}

// This is now a Server Component
export default async function HomePage() {
    console.log('HomePage Server Component executing...'); // Add entry log
    // Read static content from markdown files
    // console.log('Reading content files...'); // Remove older log
    const allFaqItems = getContentData<FaqItem>('content/faq');
    const allServiceInfoItems = getContentData<ServiceInfoItem>('content/services');
    // console.log('Raw FAQ Items Found:', allFaqItems.length); // Remove older log
    // console.log('Raw Service Info Found:', allServiceInfoItems.length); // Remove older log

    // Filter and sort based on frontmatter
    const faqItems = allFaqItems
        .filter((item: any) => item.is_active !== false)
        .sort((a, b) => (a.display_order || 99) - (b.display_order || 99));

    const serviceInfoItems = allServiceInfoItems
        .filter((item: any) => item.is_active !== false && item.display_on_homepage === true);

    // console.log('Filtered FAQ Items to pass:', faqItems.length); // Remove older log
    // console.log('Filtered Service Info to pass:', serviceInfoItems.length); // Remove older log
    console.log(`HomePage passing ${faqItems.length} FAQs and ${serviceInfoItems.length} Services to client.`);

    return (
        <HomePageClientContent
            initialFaqItems={faqItems}
            initialServiceInfoItems={serviceInfoItems}
        />
    );
} 