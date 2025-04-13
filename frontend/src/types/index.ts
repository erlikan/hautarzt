// Define interfaces based on API Documentation

// Structure for the response of GET /rest/v1/service
export interface Service {
    id: number;
    name: string;
}

// Structure for GeoJSON Point
export interface GeoJsonPoint {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
}

// Structure for the nested analysis data
export interface PraxisAnalysisData {
    termin_wartezeit_positiv: number | null;
    termin_wartezeit_neutral: number | null;
    termin_wartezeit_negativ: number | null;
    freundlichkeit_empathie_positiv: number | null; // Assuming similar names exist
    freundlichkeit_empathie_neutral: number | null;
    freundlichkeit_empathie_negativ: number | null;
    aufklaerung_vertrauen_positiv: number | null;
    aufklaerung_vertrauen_neutral: number | null;
    aufklaerung_vertrauen_negativ: number | null;
    kompetenz_behandlung_positiv: number | null;
    kompetenz_behandlung_neutral: number | null;
    kompetenz_behandlung_negativ: number | null;
    praxis_ausstattung_positiv: number | null;
    praxis_ausstattung_neutral: number | null;
    praxis_ausstattung_negativ: number | null;
    tags: string[] | null;
    staerken: string[] | null;
    schwaechen: string[] | null;
    mentioned_doctors: string[] | null;
    emotionale_tags: string[] | null;
    haeufig_genannte_begriffe: string[] | null;
    trend: string | null;
    trend_begruendung: string | null;
    vergleich_kasse_privat: string | null;
    zusammenfassung: string | null;
    overall_score: number | null;
    analyzed_at: string | null;
    last_error_message: string | null;
    // Add created_at, updated_at if needed from API
}

// UPDATED Summary structure to match praxis-search Edge Function response
export interface PraxisSummary {
    google_place_id: string;
    slug: string;
    name: string;
    address: string; // Changed from adresse
    city: string;
    city_slug: string; // Added derived city slug from Edge Function
    postal_code: string; // Changed from plz
    photo: string | null;
    overall_score: number | null; // Now top-level
    distance: number | null; // Added distance
    analysis_summary_snippet: string | null; // Added snippet
    analysis_tags: string[]; // Added tags array
    analysis_aspects_status: { // Added aspect status object
        termin_wartezeit: 'positive' | 'neutral' | 'negative' | 'unknown';
        freundlichkeit_empathie: 'positive' | 'neutral' | 'negative' | 'unknown';
        aufklaerung_vertrauen: 'positive' | 'neutral' | 'negative' | 'unknown';
        kompetenz_behandlung: 'positive' | 'neutral' | 'negative' | 'unknown';
        praxis_ausstattung: 'positive' | 'neutral' | 'negative' | 'unknown';
    };
    offered_service_names: string[]; // Added service names array
    award_badges: string[]; // Added (currently empty)
    business_status?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY' | null; // Keep this
    located_in?: string | null; // Keep this
    // Optional fields that might be useful from list items
    latitude?: number | null;
    longitude?: number | null;
    telefon?: string | null;
    bewertung_count?: number; // Assuming Edge Function could still return this if selected in SP
}

// Structure for the response of GET /api/praxis-details/{stadtSlug}/{praxisSlug}
export interface PraxisDetail {
    id: string;
    google_place_id: string;
    slug: string;
    name: string;
    full_address: string;
    // Separate address components if available and needed, otherwise derive from full_address
    street?: string; // Assuming this might be derived or added later
    city: string;
    postal_code: string;
    country_code?: string; // Needed for Schema.org, default to 'DE' if missing
    latitude: number | null;
    longitude: number | null;
    phone: string | null;
    site: string | null;
    booking_appointment_link?: string | null; // Added optional booking link field
    location: GeoJsonPoint | null;
    rating: number | null;
    reviews: number | null;
    reviews_per_score_1?: number | null; // Add 2-5 if needed
    reviews_per_score_2?: number | null;
    reviews_per_score_3?: number | null;
    reviews_per_score_4?: number | null;
    reviews_per_score_5?: number | null;
    working_hours: any | null; // Use 'any' for now, refine if structure is known
    about: any | null; // Already any, ensure it exists
    photo: string | null;
    analysis_status: 'pending' | 'processing' | 'completed' | 'failed' | null;
    created_at?: string;
    updated_at?: string;
    business_status?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY' | null;
    description?: string | null;
    popular_times?: any | null;
    located_in?: string | null;

    analysis: PraxisAnalysisData | null; // Analysis data can be null if not completed/failed

    services: Service[] | null;
}

// Structure for the response of GET /api/praxis-search (data part)
// This will be a subset of PraxisDetail
export interface PraxisListItem {
    google_place_id: string;
    slug: string;
    name: string;
    full_address: string;
    city: string;
    postal_code: string;
    latitude: number | null;
    longitude: number | null;
    photo: string | null;
    business_status?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY' | null;
    analysis: { // Only include fields needed for the list item card
        overall_score: number | null;
        termin_wartezeit_positiv: number | null;
        termin_wartezeit_negativ: number | null;
        freundlichkeit_empathie_positiv: number | null; // Assuming needed
        freundlichkeit_empathie_negativ: number | null;
        aufklaerung_vertrauen_positiv: number | null;
        aufklaerung_vertrauen_negativ: number | null;
        kompetenz_behandlung_positiv: number | null;
        kompetenz_behandlung_negativ: number | null;
        praxis_ausstattung_positiv: number | null;
        praxis_ausstattung_negativ: number | null;
        zusammenfassung: string | null; // For snippet
        tags: string[] | null; // For tags
    } | null;
    services: Service[] | null;
}

// Structure for the response of GET /api/praxis-search (full response)
export interface PraxisSearchApiResponse {
    data: PraxisListItem[];
    meta: {
        totalItems: number;
        itemCount: number;
        itemsPerPage: number;
        totalPages: number;
        currentPage: number;
    };
}

// Structure for Schema.org OpeningHoursSpecification
export interface OpeningHoursSpecification {
    "@type": "OpeningHoursSpecification";
    dayOfWeek: string[]; // e.g., ["Monday", "Tuesday"]
    opens: string; // e.g., "08:00"
    closes: string; // e.g., "13:00"
} 