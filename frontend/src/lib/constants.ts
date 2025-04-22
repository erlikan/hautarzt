export const CORE_DERMATOLOGY_IDENTIFIERS = new Set([
    'Hautarzt',
    'Allergologe',
    'Venerologe',
    'Kinderdermatologe'
]);

// Keywords to look for in subtypes/tags to highlight relevant services on cards
export const HIGHLIGHT_SERVICE_KEYWORDS = [
    // Add keywords in lowercase for case-insensitive matching
    'hautkrebsvorsorge',
    'krebsvorsorge',
    'laser',
    'lasertherapie',
    'allergie',
    'allergietest',
    'akne',
    'aknebehandlung',
    'ästhetik',
    'ästhetische',
    'botox',
    'filler',
    'faltenbehandlung',
    'muttermal',
    'muttermalkontrolle',
    'operation',
    'ambulante operation',
    'venen',
    'phlebologie',
    'proktologie',
    'podologie',
    'fußpflege'
    // Add more relevant keywords as needed
];

// Maximum number of highlight snippets to show on a card
export const MAX_HIGHLIGHT_SNIPPETS = 3;

// --- Constants for Search/Redirect ---

// Basic regex for German 5-digit ZIP codes
export const GERMAN_ZIP_REGEX = /^\d{5}$/;

// Max length for search queries to prevent abuse
export const MAX_QUERY_LENGTH = 100; 