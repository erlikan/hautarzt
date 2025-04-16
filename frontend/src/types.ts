// Represents the summary data for a praxis returned by search results
export interface PraxisSummary {
    google_place_id: string;
    slug: string;
    name: string;
    address: string | null;
    city: string | null;
    city_slug: string | null;
    postal_code: string | null;
    latitude: number | null;
    longitude: number | null;
    photo: string | null;
    located_in: string | null;
    business_status: string | null;
    category?: string | null; // Added
    subtypes?: string[] | null; // Added
    overall_score: number | null;
    bewertung_count?: number | null;
    analysis_summary_snippet?: string | null;
    analysis_tags?: string[] | null;
    analysis_aspects_status?: PraxisAnalysisAspectStatus | null;
    distance_meters?: number | null;
    // Fields potentially missing based on previous context - ensure they are needed/returned by SP
    offered_service_names?: string[];
    award_badges?: string[];
}

// Interface for the structure within the analysis JSON object returned by search
// Derived from the jsonb_build_object in search_praxen SP 

// Define the aspect status type used in PraxisSummary
export type PraxisAnalysisAspectStatus = {
    termin_wartezeit: 'positive' | 'neutral' | 'negative' | 'unknown';
    freundlichkeit_empathie: 'positive' | 'neutral' | 'negative' | 'unknown';
    aufklaerung_vertrauen: 'positive' | 'neutral' | 'negative' | 'unknown';
    kompetenz_behandlung: 'positive' | 'neutral' | 'negative' | 'unknown';
    praxis_ausstattung: 'positive' | 'neutral' | 'negative' | 'unknown';
};

// Define the structure of the FULL analysis object
export interface PraxisAnalysis {
    praxis_google_place_id: string;
    termin_wartezeit_positiv?: number | null;
    termin_wartezeit_neutral?: number | null;
    termin_wartezeit_negativ?: number | null;
    freundlichkeit_empathie_positiv?: number | null;
    freundlichkeit_empathie_neutral?: number | null;
    freundlichkeit_empathie_negativ?: number | null;
    aufklaerung_vertrauen_positiv?: number | null;
    aufklaerung_vertrauen_neutral?: number | null;
    aufklaerung_vertrauen_negativ?: number | null;
    kompetenz_behandlung_positiv?: number | null;
    kompetenz_behandlung_neutral?: number | null;
    kompetenz_behandlung_negativ?: number | null;
    praxis_ausstattung_positiv?: number | null;
    praxis_ausstattung_neutral?: number | null;
    praxis_ausstattung_negativ?: number | null;
    tags?: string[] | null;
    staerken?: string[] | null;
    schwaechen?: string[] | null;
    mentioned_doctors?: string[] | null;
    emotionale_tags?: string[] | null;
    haeufig_genannte_begriffe?: string[] | null;
    trend?: 'positive' | 'negativ' | 'neutral' | null;
    trend_begruendung?: string | null;
    vergleich_kasse_privat?: string | null;
    zusammenfassung?: string | null;
    overall_score?: number | null;
    analyzed_at?: string | null;
}

// Interface for individual services 
export interface Service {
    id: number;
    name: string; // Added name based on LeistungenSection usage
}

// Simplified and consolidated interface for the Detail Page data
// Combines fields from praxis, analysis, and linked services
export interface PraxisDetail {
    // Core Praxis Fields
    google_place_id: string;
    name: string;
    slug?: string | null;
    full_address?: string | null;
    street?: string | null;
    city?: string | null;
    postal_code?: string | null;
    state?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    rating?: number | null; // Google Rating
    reviews?: number | null; // Google Review Count
    site?: string | null;
    phone?: string | null;
    category?: string | null;  // <<< Ensure this is present
    subtypes?: string[] | null; // <<< Ensure this is present
    photo?: string | null;
    working_hours?: any | null; // Consider defining a stricter type later
    about?: any | null; // Consider defining a stricter type later
    booking_appointment_link?: string | null;
    city_slug?: string | null;
    located_in?: string | null;
    business_status?: string | null;
    country_code?: string | null; // <<< ADDED FIELD
    updated_at?: string | null;
    description?: string | null;
    // Potentially add bewertung_count if it comes from praxis table
    bewertung_count?: number | null;

    // Nested Analysis Data
    analysis?: PraxisAnalysis | null;

    // Nested Services Data
    services?: Service[] | null;
}

// Remove the separate PraxisBase if not needed elsewhere
// interface PraxisBase { ... } 

// Type previously missing, might be needed by KiDashboard or elsewhere
// Ensure this matches the data structure used
export interface PraxisAnalysisData extends PraxisAnalysis { }

// --- Types for Static Content --- 

export interface FaqItem {
    id: string; // Filename/slug
    question: string;
    answer: string; // Markdown content
    display_order?: number;
    is_active?: boolean;
}

export interface ServiceInfoItem {
    id: string; // Filename/slug
    slug: string;
    title: string;
    summary?: string | null;
    icon_name?: string | null;
    display_on_homepage?: boolean;
    is_active?: boolean;
    // content?: string; // If you need the full content later
} 