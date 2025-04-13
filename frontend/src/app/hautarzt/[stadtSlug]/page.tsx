// Keep necessary imports for generateMetadata
import { apiService } from '../../../services/api'; // Adjust path if needed
// Use new SearchPraxenParams type
import type { SearchPraxenParams } from '../../../services/api';
import type { Metadata, ResolvingMetadata } from 'next';
// Import the new client component
import StadtPageClientContent from '../../../components/stadt/StadtPageClientContent';
import { capitalizeCity } from '../../../lib/utils'; // Import helper
// TODO: Potentially add types from 'schema-dts' if library is added

// --- generateMetadata Function --- 
type Props = {
    params: { stadtSlug: string };
    searchParams: { [key: string]: string | string[] | undefined }; // Include searchParams
};

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { stadtSlug } = params;
    const isNearby = stadtSlug === 'nearby';
    const stadtName = isNearby ? 'Ihrer Nähe' : capitalizeCity(stadtSlug);

    // --- Basic Metadata --- 
    let title = `Hautärzte in ${stadtName} | Patienteneinblicke`;
    let description = `Finden Sie Hautärzte in ${stadtName} basierend auf analysierten Patientenerfahrungen.`;
    if (!isNearby) {
        title = `Hautärzte in ${stadtName}: Praxen finden & vergleichen | Patienteneinblicke`;
        description = `Liste der Hautärzte in ${stadtName}. Vergleichen Sie Praxen basierend auf analysierten Patientenerfahrungen zu Wartezeit, Kompetenz und Freundlichkeit. Finden Sie den passenden Arzt.`;
    }

    // --- Fetch Data for JSON-LD --- 
    // Fetch the first page of results to populate ItemList
    // TODO: Avoid duplicate data fetching if possible (metadata + page component)
    let praxenData = null;
    if (!isNearby) { // Don't fetch for "nearby" as it depends on user location
        try {
            // Construct the SearchPraxenParams object for the API call
            const searchParamsForMeta: SearchPraxenParams = {
                contextCitySlug: stadtSlug, // Use the slug for context
                page: 1,
                pageSize: 10, // Fetch first 10 for ItemList
                sortBy: 'score', // Default sort for initial list
                sortDirection: 'desc'
            };
            praxenData = await apiService.searchPraxen(searchParamsForMeta);
        } catch (error) {
            console.error(`Error fetching praxis list for metadata (${stadtSlug}):`, error);
            // Handle error case - perhaps return metadata without ItemList?
        }
    }

    // --- Construct JSON-LD Schemas --- 
    const schemas = [];

    // 1. BreadcrumbList
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Startseite", // Assuming a name for the homepage
                // TODO: Get base URL dynamically if possible (e.g., from env vars)
                "item": process.env.NEXT_PUBLIC_BASE_URL || "/",
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": `Hautärzte in ${stadtName}`,
                "item": `${process.env.NEXT_PUBLIC_BASE_URL || ''}/hautarzt/${stadtSlug}`,
            }
        ]
    };
    schemas.push(breadcrumbSchema);

    // 2. ItemList (only if not nearby and data fetched successfully)
    if (!isNearby && praxenData && praxenData.data) {
        const itemListSchema = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": `Hautärzte in ${stadtName}`,
            "description": description, // Use same description as meta tag
            "numberOfItems": praxenData.meta.totalItems || praxenData.data.length, // Total count from API
            "itemListElement": praxenData.data.map((praxis, index) => ({
                "@type": "ListItem",
                "position": index + 1, // Position on the current page (1-based)
                "item": {
                    "@type": "MedicalClinic", // Or Physician
                    "name": praxis.name,
                    "url": `${process.env.NEXT_PUBLIC_BASE_URL || ''}/hautarzt/${praxis.city_slug || stadtSlug}/${praxis.slug}`, // Use city_slug if available
                    // Optional: Add address and rating if available
                    "address": praxis.city && praxis.postal_code ? {
                        "@type": "PostalAddress",
                        "addressLocality": praxis.city,
                        "postalCode": praxis.postal_code
                    } : undefined,
                    // Use top-level score and check bewertung_count existence
                    "aggregateRating": praxis.overall_score !== null && praxis.overall_score !== undefined && praxis.bewertung_count ? {
                        "@type": "AggregateRating",
                        "ratingValue": Math.round((praxis.overall_score / 20) * 10) / 10,
                        "bestRating": "5",
                        "worstRating": "1",
                        "ratingCount": praxis.bewertung_count
                    } : undefined
                }
            }))
        };
        schemas.push(itemListSchema);
    }

    return {
        title: title,
        description: description,
        alternates: {
            canonical: `/hautarzt/${stadtSlug}`,
        },
        openGraph: {
            title: title,
            description: description,
            url: `/hautarzt/${stadtSlug}`,
            siteName: 'Hautarzt Vergleich',
            locale: 'de_DE',
            type: 'website',
        },
        // Include the JSON-LD scripts
        other: {
            'application/ld+json': JSON.stringify(schemas),
        }
    };
}

// --- Page Component (Server Component) --- 
// This component now only renders the client component
// It implicitly passes params and searchParams to the client component
export default function StadtPage() {
    return <StadtPageClientContent />;
} 