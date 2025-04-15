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