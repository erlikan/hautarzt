import { PraxisDetail, OpeningHoursSpecification } from '@/types';

// --- Helper Functions ---

/**
 * Converts the overall_score (0-100) to a 1-5 rating scale.
 * Returns null if the score is null or invalid.
 */
function convertScoreToRatingValue(score: number | null | undefined): string | null {
    if (score === null || score === undefined || isNaN(score)) return null;
    const clampedScore = Math.max(0, Math.min(100, score));
    // Schema.org expects string for ratingValue
    const rating = Math.round((clampedScore / 20) * 10) / 10;
    return Math.max(1, rating).toFixed(1); // Return as string with one decimal
}

/**
 * Parses the working_hours object into Schema.org OpeningHoursSpecification format.
 * Assumes input format like: { Montag: '09:00-13:00', Dienstag: 'Geschlossen', ... }
 * Returns an array of OpeningHoursSpecification or null if parsing fails or data is missing.
 */
function parseWorkingHours(workingHours: any): OpeningHoursSpecification[] | null {
    if (!workingHours || typeof workingHours !== 'object' || Array.isArray(workingHours) || Object.keys(workingHours).length === 0) {
        return null;
    }
    const dayMapping: { [key: string]: string } = {
        'Montag': 'Monday', 'Dienstag': 'Tuesday', 'Mittwoch': 'Wednesday',
        'Donnerstag': 'Thursday', 'Freitag': 'Friday', 'Samstag': 'Saturday', 'Sonntag': 'Sunday'
    };
    const result: OpeningHoursSpecification[] = [];
    try {
        for (const germanDay in workingHours) {
            if (!workingHours.hasOwnProperty(germanDay)) continue;
            const schemaDay = dayMapping[germanDay];
            const timeString = workingHours[germanDay];
            if (!schemaDay || !timeString || typeof timeString !== 'string' || timeString.toLowerCase() === 'geschlossen') continue;

            // Handle potential multiple ranges, e.g., "08:00-12:00, 14:00-18:00"
            const ranges = timeString.split(',');
            for (const range of ranges) {
                const timeParts = range.trim().split('-');
                if (timeParts.length === 2) {
                    const opens = timeParts[0].trim();
                    const closes = timeParts[1].trim();
                    // Validate HH:MM format
                    if (/^\d{2}:\d{2}$/.test(opens) && /^\d{2}:\d{2}$/.test(closes)) {
                        result.push({
                            "@type": "OpeningHoursSpecification",
                            dayOfWeek: [schemaDay],
                            opens: opens,
                            closes: closes,
                        });
                    } else { console.warn(`SchemaOrg: Invalid time format in range: ${range}`); }
                } else { console.warn(`SchemaOrg: Could not parse time range: ${range}`); }
            }
        }
        // Group entries by opens/closes times
        const groupedResult = result.reduce((acc, spec) => {
            const key = `${spec.opens}-${spec.closes}`;
            if (!acc[key]) {
                acc[key] = { ...spec, dayOfWeek: [] };
            }
            acc[key].dayOfWeek.push(...spec.dayOfWeek);
            return acc;
        }, {} as Record<string, OpeningHoursSpecification>);

        return Object.values(groupedResult).length > 0 ? Object.values(groupedResult) : null;

    } catch (error) {
        console.error('Error parsing working hours for SchemaOrgJsonLd:', error, 'Data:', workingHours);
        return null;
    }
}

function formatTimeRange(range: string): string | null {
    const parts = range.split('–'); // Using En dash
    if (parts.length === 2) {
        const opens = parts[0].trim();
        const closes = parts[1].trim();
        // Basic validation (ensure HH:MM format)
        if (/^\d{1,2}:\d{2}$/.test(opens) && /^\d{1,2}:\d{2}$/.test(closes)) {
            return `${opens}-${closes}`;
            // } else { console.warn(`SchemaOrg: Invalid time format in range: ${range}`); }
        } // Keep console.warn commented out for prod
        // } else { console.warn(`SchemaOrg: Could not parse time range: ${range}`); }
    } // Keep console.warn commented out for prod
    return null;
}

// --- Component Props ---

interface SchemaOrgJsonLdProps {
    praxis: PraxisDetail;
    stadtSlug: string;
    praxisSlug: string;
}

// --- Component ---

const SchemaOrgJsonLd: React.FC<SchemaOrgJsonLdProps> = ({ praxis, stadtSlug, praxisSlug }) => {
    const ratingValue = convertScoreToRatingValue(praxis.analysis?.overall_score);
    const ratingCount = praxis.reviews ?? 0;
    const openingHours = parseWorkingHours(praxis.working_hours);
    const canonicalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/hautarzt/${stadtSlug}/${praxisSlug}`; // Use base URL

    // Extract Street Address carefully
    const streetAddress = praxis.full_address?.split(',')[0]?.trim() || praxis.full_address || "";

    const schemaData: any = {
        "@context": "https://schema.org",
        "@type": "MedicalClinic",
        "name": praxis.name,
        "description": `${praxis.name} - Hautarzt in ${praxis.city}. Patienteneinblicke und Erfahrungsberichte.`,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": streetAddress, // Use extracted street address
            "addressLocality": praxis.city,
            "postalCode": praxis.postal_code,
            "addressCountry": "DE"
        },
        "url": canonicalUrl // Use full canonical URL
    };

    // Optional fields
    if (praxis.latitude && praxis.longitude) {
        schemaData["geo"] = { "@type": "GeoCoordinates", "latitude": praxis.latitude, "longitude": praxis.longitude };
    }
    if (praxis.phone) {
        schemaData["telephone"] = praxis.phone;
    }
    // Use booking link if available, otherwise site
    if (praxis.booking_appointment_link || praxis.site) {
        schemaData["url"] = praxis.booking_appointment_link || praxis.site;
    }
    if (praxis.photo) {
        schemaData["image"] = praxis.photo;
    }
    if (openingHours && openingHours.length > 0) {
        schemaData["openingHoursSpecification"] = openingHours;
    }
    if (ratingValue !== null && ratingCount > 0) {
        schemaData["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": ratingValue, // Already string
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": ratingCount.toString()
        };
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData, null, 2) }}
            id="schema-org-data" // Add ID for easier debugging
        />
    );
};

export default SchemaOrgJsonLd; 