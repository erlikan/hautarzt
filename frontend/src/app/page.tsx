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
    // console.log(`[getContentData] Attempting to read content from: ${contentDirectory}`); // REMOVE LOG
    try {
        const filenames = fs.readdirSync(contentDirectory);
        // console.log(`[getContentData] Found ${filenames.length} files/dirs in ${directory}:`, filenames); // REMOVE LOG

        const items = filenames
            .filter(filename => {
                const isMarkdown = filename.endsWith('.md');
                return isMarkdown;
            })
            .map((filename): T => {
                // console.log(`[getContentData] Processing file: ${filename}`); // REMOVE LOG
                const slug = filename.replace(/\.md$/, '');
                const filePath = path.join(contentDirectory, filename);
                const fileContents = fs.readFileSync(filePath, 'utf8');
                const { data: frontmatter, content: markdownContent } = matter(fileContents);
                // console.log(`[getContentData] Parsed ${filename}, frontmatter keys:`, Object.keys(frontmatter)); // REMOVE LOG
                // console.log(`[getContentData] Parsed ${filename} -> Content:`, markdownContent.substring(0, 50) + '...'); // REMOVE LOG

                let itemData: any = {
                    id: slug,
                    ...frontmatter,
                };

                if (directory === 'content/faq') {
                    itemData.answer = markdownContent.trim();
                } else if (directory === 'content/services') {
                    // Add content if needed for service detail pages later
                    itemData.content = markdownContent.trim(); // Assign trimmed content here too if needed
                }

                if (directory === 'content/faq' && typeof itemData.question !== 'string') {
                    // Keep important warnings
                    console.warn(`[getContentData] Missing 'question' in frontmatter for ${filename}`);
                }

                return itemData as T;
            });
        // console.log(`[getContentData] Successfully processed ${items.length} items from ${directory}.`); // REMOVE LOG
        return items;
    } catch (error) {
        console.error(`[getContentData] Error reading content from ${directory}:`, error); // Keep error logs
        return [];
    }
}

// This is now a Server Component
export default async function HomePage() {
    // console.log('HomePage Server Component executing...'); // REMOVE LOG
    const allFaqItems = getContentData<FaqItem>('content/faq');
    const allServiceInfoItems = getContentData<ServiceInfoItem>('content/services');

    // Filter and sort based on frontmatter
    const faqItems = allFaqItems
        .filter((item: any) => item.is_active !== false)
        .sort((a, b) => (a.display_order || 99) - (b.display_order || 99));

    const serviceInfoItems = allServiceInfoItems
        .filter((item: any) => item.is_active !== false && item.display_on_homepage === true);

    // console.log(`HomePage passing ${faqItems.length} FAQs and ${serviceInfoItems.length} Services to client.`); // REMOVE LOG

    return (
        <HomePageClientContent
            initialFaqItems={faqItems}
            initialServiceInfoItems={serviceInfoItems}
        />
    );
} 