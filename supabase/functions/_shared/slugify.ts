// supabase/functions/_shared/slugify.ts

// Function to transliterate German special characters
function transliterateGerman(text: string): string {
    const map: { [key: string]: string } = {
        'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue', 'ß': 'ss',
    };
    return text.replace(/[äöüÄÖÜß]/g, (match) => map[match] || match);
}

// Main slugification function
export function createSlug(text: string | null | undefined): string {
    if (!text) {
        // Return a default or handle appropriately if input is null/undefined
        // Using 'stadt' as a fallback, adjust if needed
        return 'stadt';
    }

    const transliterated = transliterateGerman(text);

    return transliterated
        .toString()                      // Ensure input is a string
        .toLowerCase()                   // Convert to lowercase
        .normalize('NFD')                // Split accented characters into base characters and diacritics
        .replace(/[̀-ͯ]/g, '') // Remove diacritics
        .replace(/\s+/g, '-')            // Replace spaces with -
        .replace(/[^\w-]+/g, '')         // Remove all non-word chars except hyphens
        .replace(/--+/g, '-')           // Replace multiple - with single -
        .replace(/^-+/, '')              // Trim - from start of text
        .replace(/-+$/, '');             // Trim - from end of text
} 