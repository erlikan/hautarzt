// Keep only necessary imports for generateMetadata and the page component
import { apiService } from '../../../../services/api';
import type { Metadata, ResolvingMetadata } from 'next';
import PraxisDetailClientContent from '../../../../components/praxis/PraxisDetailClientContent'; // Import the new client component
// TODO: Potentially add import { MedicalClinic } from 'schema-dts'; for type safety if library is added

// Function to generate dynamic metadata
// Note: Fetching data directly here assumes App Router setup
// We might need to adjust based on how data fetching is structured (e.g., if page is pure client)
// For now, let's assume we can re-fetch needed data here.
// TODO: Refactor data fetching to avoid duplicate calls if possible.

type Props = {
    params: { stadtSlug: string; praxisSlug: string };
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { stadtSlug, praxisSlug } = params;

    // Fetch data needed for metadata (minimal fetch if possible)
    const praxis = await apiService.getPraxisDetailBySlug(stadtSlug, praxisSlug);

    if (!praxis) {
        return {
            title: "Praxis nicht gefunden",
            description: "Die angeforderte Praxis konnte nicht gefunden werden.",
        };
    }

    // Construct metadata based on template
    const title = `${praxis.name} - Hautarzt in ${praxis.city} | Einblicke & Score`;
    const scoreText = praxis.analysis?.overall_score
        ? ` Unser Score: ${praxis.analysis.overall_score.toFixed(1)}/100.`
        : '';
    const description = `Finden Sie detaillierte Patienteneinblicke für ${praxis.name} in ${praxis.city}.${scoreText} Erfahren Sie mehr über Kompetenz, Wartezeit und Freundlichkeit.`;

    // Optional: Ensure length constraints (can add helper function later)
    const truncatedTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
    const truncatedDescription = description.length > 160 ? description.substring(0, 157) + '...' : description;

    // --- Construct JSON-LD Schema ---
    // TODO: Add robust handling for missing optional fields (phone, site, photo, working_hours, lat/lon)
    // TODO: Implement proper parsing/formatting for praxis.working_hours based on its actual structure
    const medicalClinicSchema = {
        "@context": "https://schema.org",
        "@type": "MedicalClinic",
        "name": praxis.name,
        "description": truncatedDescription, // Use the same description as meta tag
        "address": {
            "@type": "PostalAddress",
            "streetAddress": praxis.street || '',
            "addressLocality": praxis.city || '',
            "postalCode": praxis.postal_code || '',
            "addressCountry": praxis.country_code || "DE", // Default to DE if not provided
        },
        "geo": praxis.latitude && praxis.longitude ? {
            "@type": "GeoCoordinates",
            "latitude": praxis.latitude, // Ensure this is a number
            "longitude": praxis.longitude, // Ensure this is a number
        } : undefined,
        "telephone": praxis.phone || undefined, // Ensure international format if provided by API
        "url": praxis.site || undefined,
        "image": praxis.photo || undefined, // URL to the image
        //   "openingHoursSpecification": [], // Placeholder - Requires parsing praxis.working_hours
        "aggregateRating": praxis.analysis?.overall_score && praxis.reviews ? {
            "@type": "AggregateRating",
            // Convert 0-100 score to 1-5 scale
            "ratingValue": Math.round((praxis.analysis.overall_score / 20) * 10) / 10, // Rounds to one decimal place
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": praxis.reviews // Assuming praxis.reviews holds the count
        } : undefined,
    };

    return {
        title: truncatedTitle,
        description: truncatedDescription,
        alternates: {
            canonical: `/hautarzt/${stadtSlug}/${praxisSlug}`,
        },
        // Include the JSON-LD script in the metadata
        // Next.js will handle rendering this in a <script type="application/ld+json"> tag
        other: {
            'application/ld+json': JSON.stringify(medicalClinicSchema),
        }
    };
}

// --- Page Component (Server Component) --- 
// This component now only renders the client component
export default function PraxisDetailPage() {
    // No client-side hooks (useState, useEffect, useParams) are allowed here
    return <PraxisDetailClientContent />;
}