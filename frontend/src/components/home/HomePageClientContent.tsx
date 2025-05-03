'use client'; // <<< Add this directive

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDebouncedCallback } from 'use-debounce'; // Import debounce hook
// Shadcn UI / Lucide Imports
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, MapPin, Clock, Heart, ShieldCheck, AlertCircle, Navigation, CheckCircle, Smile, Award, ChevronRight, Link as LinkIcon, Building } from 'lucide-react';
import Image from 'next/image';
// Import Command component for autocomplete
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput, // We might use a regular Input instead
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover" // For dropdown
// Import types from central location
import type { FaqItem, ServiceInfoItem } from '@/types'; // Adjust path if needed
// Use default import for ReactMarkdown
import ReactMarkdown from 'react-markdown';

// --- Remove hardcoded constants/types, accept as props --- 
// interface CityData { ... }
// const popularCities: CityData[] = [ ... ];
// const faqItems = [ ... ];

// Define prop types
// interface FaqItem { ... }
// interface ServiceInfoItem { ... }

// Define interface for City Card data
interface CityData {
    slug: string;
    name: string;
    imageUrl: string; // Direct URL to the image file (.jpg, .png, .webp)
    attribution?: 'freepik'; // Optional flag for attribution type
}

// --- IMPORTANT: Replace placeholders with ACTUAL direct image URLs --- 
const popularCities: CityData[] = [
    { slug: 'berlin', name: 'Berlin', imageUrl: 'https://img.freepik.com/fotos-kostenlos/gebaeude-mit-saeulen_1160-803.jpg', attribution: 'freepik' },
    { slug: 'hamburg', name: 'Hamburg', imageUrl: 'https://img.freepik.com/fotos-kostenlos/gewaesser-zwischen-braunen-betongebaeuden-in-hamburg-deutschland-waehrend-des-tages_181624-4335.jpg', attribution: 'freepik' },
    { slug: 'muenchen', name: 'München', imageUrl: 'https://img.freepik.com/fotos-kostenlos/muenchen-uebersicht_181624-45129.jpg', attribution: 'freepik' },
    { slug: 'koeln', name: 'Köln', imageUrl: 'https://img.freepik.com/fotos-kostenlos/gotische-kathedrale-mit-zwei-tuermen_250224-150.jpg', attribution: 'freepik' },
    { slug: 'frankfurt', name: 'Frankfurt', imageUrl: 'https://img.freepik.com/fotos-kostenlos/stadtbild-von-frankfurt-bedeckt-in-modernen-gebaeuden-waehrend-des-sonnenuntergangs-in-deutschland_181624-12287.jpg', attribution: 'freepik' },
    { slug: 'leipzig', name: 'Leipzig', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Leipzig_von_oben_-_panoramio_%281%29.jpg/1920px-Leipzig_von_oben_-_panoramio_%281%29.jpg' }, // Replace with a clearly licensed image URL
];

// Type for disambiguation options
interface DisambiguationOption {
    value: string;
    slug: string;
}

// Updated interface for suggestions
interface Suggestion {
    value: string;
    slug: string;
}

interface HomePageClientContentProps {
    initialFaqItems: FaqItem[];
    initialServiceInfoItems: ServiceInfoItem[];
    // popularCities?: CityData[]; // Could also be passed as prop
}

// Accept props
export default function HomePageClientContent({
    initialFaqItems,
    initialServiceInfoItems
}: HomePageClientContentProps) {
    // Log received props ONCE on mount
    useEffect(() => {
        // console.log('[HomePageClientContent] Initial FAQ Items Prop:', initialFaqItems);
        // console.log('[HomePageClientContent] Initial Service Info Prop:', initialServiceInfoItems);
    }, [initialFaqItems, initialServiceInfoItems]); // Run only when props change

    const router = useRouter();
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null); // Separate location error
    // --- NEW STATE --- 
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [disambiguationOptions, setDisambiguationOptions] = useState<DisambiguationOption[] | null>(null);

    // --- State for Autocomplete (Updated type) --- 
    const [allCities, setAllCities] = useState<Suggestion[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    // --- Fetch static city data on mount ---
    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await fetch('/data/city-suggestions.json');
                if (!response.ok) throw new Error('Failed to fetch city data');
                const data: Suggestion[] = await response.json(); // Type assertion updated
                setAllCities(data);
                // console.log(`[HomePage] Loaded ${data.length} cities for suggestions.`);
            } catch (fetchError) {
                // console.error("Error loading city suggestions:", fetchError);
                // Handle error - maybe show a message?
            }
        };
        fetchCities();
    }, []); // Empty dependency array means run once on mount

    // --- Debounced input handler (updates suggestions) --- 
    const handleFilterSuggestions = useDebouncedCallback((value: string) => {
        if (value.length >= 2) {
            const lowerValue = value.toLowerCase();
            // --- UPDATED FILTERING LOGIC --- 
            const filtered = allCities.filter(suggestion =>
                suggestion.value.toLowerCase().startsWith(lowerValue) // Filter on 'value', use startsWith
            ).slice(0, 10); // Increased limit slightly to show more PLZs
            setSuggestions(filtered);
            // console.log("Suggestions updated:", filtered); 
        } else {
            setSuggestions([]);
        }
    }, 300);

    // --- Handler for CommandInput value change ---
    const handleInputValueChange = (search: string) => {
        setInputValue(search); // Update the raw input value state
        handleFilterSuggestions(search); // Trigger the debounced suggestion filtering
        // Keep popover open while typing if it was already open
        if (!isPopoverOpen && search.length >= 2) {
            // This might fight with manual popover trigger, Command usually handles list visibility
            // Let's rely on Popover onOpenChange and CommandEmpty for visibility logic.
        }
    };

    // --- Handle suggestion selection --- 
    const handleSuggestionSelect = (slug: string) => {
        // console.log(`Suggestion selected: ${slug}`);
        setInputValue('');
        setSuggestions([]);
        setIsPopoverOpen(false);
        router.push(`/hautarzt/${slug}`);
    };

    // Assign props to local constants
    const faqItems = initialFaqItems;
    const serviceInfoItems = initialServiceInfoItems;

    const handleLocationClick = () => {
        setLocationError(null);
        if ('geolocation' in navigator) {
            setIsLoadingLocation(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    router.push(`/hautarzt/nearby?lat=${latitude}&lon=${longitude}`);
                    setIsLoadingLocation(false);
                },
                (err) => {
                    // console.error('Geolocation error:', err);
                    setLocationError('Der Standort konnte nicht ermittelt werden. Bitte erteilen Sie die Berechtigung oder versuchen Sie es später erneut.');
                    setIsLoadingLocation(false);
                }
            );
        } else {
            setLocationError('Ihr Browser unterstützt keine Standortermittlung. Bitte geben Sie Ihren Ort manuell ein.');
        }
    };

    const handleNearbySearchClick = () => {
        handleLocationClick();
    }

    // --- Handler for explicit search submission ---
    const handleSearchSubmit = async (currentValue: string) => {
        const query = currentValue.trim();
        // console.log(`[handleSearchSubmit] Query: ${query}`);

        if (!query) {
            setSearchError("Bitte geben Sie eine PLZ oder Stadt ein.");
            return;
        }

        setIsSearching(true);
        setSearchError(null);
        setDisambiguationOptions(null);
        setIsPopoverOpen(false); // Close popover on submit

        try {
            // console.log(`[handleSearchSubmit] Fetching /api/search-redirect?q=${encodeURIComponent(query)}`);
            const response = await fetch(`/api/search-redirect?q=${encodeURIComponent(query)}`);
            // console.log(`[handleSearchSubmit] Fetch response status: ${response.status}, ok: ${response.ok}`);

            if (!response.ok) {
                let errorMsg = 'Suche fehlgeschlagen. Bitte versuchen Sie es erneut.';
                try {
                    const errorJson = await response.json();
                    errorMsg = errorJson.error || errorMsg;
                } catch (_) { /* Ignore */ }
                // console.error("[handleSearchSubmit] Fetch response not OK:", errorMsg);
                throw new Error(errorMsg);
            }

            const contentType = response.headers.get("content-type");
            // console.log(`[handleSearchSubmit] Response Content-Type: ${contentType}`);
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const result = await response.json();
                // console.log("[handleSearchSubmit] Received JSON result:", result);
                if (result.type === 'disambiguation' && result.options?.length > 0) {
                    // Ensure the type assertion is correct here
                    setDisambiguationOptions(result.options as DisambiguationOption[]);
                } else if (result.type === 'no_match') {
                    setSearchError(`Keine Stadt oder PLZ für "${query}" gefunden. Bitte Eingabe prüfen.`);
                } else {
                    // console.log("[handleSearchSubmit] Unexpected JSON format or no options.");
                    setSearchError('Unerwartete Antwort vom Server.');
                }
            } else {
                // console.log(`[handleSearchSubmit] Response not JSON. Final URL: ${response.url}`);
                if (response.url && response.url !== new URL(`/api/search-redirect?q=${encodeURIComponent(query)}`, window.location.origin).toString()) {
                    // console.log(`[handleSearchSubmit] Redirect detected, navigating to: ${response.url}`);
                    const relativePath = new URL(response.url).pathname + new URL(response.url).search;
                    router.push(relativePath);
                } else {
                    // console.warn("[handleSearchSubmit] Non-JSON, non-redirected response received.");
                    setSearchError("Die Suche konnte nicht verarbeitet werden. Versuchen Sie es mit der PLZ.");
                }
            }

        } catch (error: any) {
            // console.error("[handleSearchSubmit] Error in try block:", error);
            setSearchError(error.message || 'Ein Fehler ist aufgetreten.');
        } finally {
            // console.log("[handleSearchSubmit] Setting isSearching to false.");
            setIsSearching(false);
        }
    };

    // --- RETURN JSX --- 
    return (
        <>
            {/* Hero Section */}
            <section className="bg-gradient-to-b from-blue-50 to-white pt-16 pb-12 md:pt-24 md:pb-20">
                <div className="container px-4 md:px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl mb-4">
                            Hautarzt Vergleich: Den besten Hautarzt <span className="text-blue-600">in Ihrer Nähe</span> finden
                        </h1>
                        <p className="text-lg text-muted-foreground mb-8">
                            Mit echten Patienteneinblicken zu Wartezeit, Freundlichkeit und Kompetenz.
                        </p>

                        {/* Search Area - Refactored Popover & Command */}
                        <Card className="max-w-2xl mx-auto mb-6 shadow-lg">
                            <CardContent className="p-5 md:p-6">
                                <div className="space-y-4">
                                    {/* Popover wrapping the Command */}
                                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={isPopoverOpen}
                                                className="w-full justify-start text-base py-3 px-4 pl-10 h-auto text-left font-normal relative text-muted-foreground data-[state=open]:text-foreground" // Adjust text color based on state
                                                disabled={isLoadingLocation || isSearching}
                                            >
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" />
                                                {/* Display selected value or placeholder */}
                                                {inputValue || "PLZ oder Stadt eingeben..."}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder="PLZ oder Stadt suchen..."
                                                    value={inputValue}
                                                    onValueChange={handleInputValueChange}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Escape') {
                                                            setIsPopoverOpen(false);
                                                        } else if (e.key === 'Enter' && inputValue.trim()) {
                                                            // Allow Enter to trigger search only if NO suggestions are selected/highlighted
                                                            // (Command's internal state handles Enter on suggestion selection)
                                                            const selectedValue = (e.target as HTMLInputElement).getAttribute('aria-activedescendant');
                                                            if (!selectedValue) { // Check if a suggestion is active
                                                                handleSearchSubmit(inputValue);
                                                            }
                                                        }
                                                    }}
                                                />
                                                <CommandList>
                                                    {/* Show message only when input is present but no suggestions */}
                                                    <CommandEmpty>
                                                        {inputValue.length >= 2 && suggestions.length === 0
                                                            ? 'Keine Stadt gefunden.'
                                                            : (inputValue.length < 2 ? 'Mind. 2 Buchstaben tippen...' : null)}
                                                    </CommandEmpty>
                                                    {/* Render suggestions only if input is long enough */}
                                                    {(inputValue.length >= 2 && suggestions.length > 0) && (
                                                        <CommandGroup>
                                                            {suggestions.map((suggestion) => (
                                                                <CommandItem
                                                                    key={suggestion.value}
                                                                    value={suggestion.value}
                                                                    onSelect={() => handleSuggestionSelect(suggestion.slug)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Building className="mr-2 h-4 w-4" />
                                                                    <span>{suggestion.value}</span>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    )}
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    {/* Display location or search errors */}
                                    {(locationError || searchError) && (
                                        <Alert variant="destructive" className="text-xs">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>{locationError || searchError}</AlertDescription>
                                        </Alert>
                                    )}
                                    {/* Display Disambiguation Options */}
                                    {disambiguationOptions && (
                                        <div className="pt-2 text-sm">
                                            <p className="font-medium mb-2">Meinten Sie:</p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                                {disambiguationOptions.map(opt => (
                                                    <Link key={opt.slug} href={`/hautarzt/${opt.slug}`} className="text-blue-600 hover:underline hover:text-blue-800 flex items-center gap-1">
                                                        <LinkIcon className="w-3 h-3" /> {opt.value}
                                                    </Link>
                                                ))}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">Oder versuchen Sie es mit der PLZ.</p>
                                        </div>
                                    )}

                                    {/* Buttons Row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        {/* Explicit Search Button */}
                                        <Button
                                            type="button"
                                            size="lg"
                                            className="w-full text-base bg-blue-600 hover:bg-blue-700 text-white" // Restored primary style
                                            disabled={isSearching || isLoadingLocation || !inputValue.trim()}
                                            onClick={() => handleSearchSubmit(inputValue)}
                                        >
                                            {isSearching ? 'Suche...' : <><Search className="w-4 h-4 mr-2" /> Hautärzte finden</>}
                                        </Button>
                                        {/* Nearby Button */}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="lg"
                                            className="w-full text-base"
                                            onClick={handleNearbySearchClick}
                                            disabled={isLoadingLocation || isSearching}
                                        >
                                            {isLoadingLocation ? 'Standort wird ermittelt...' : <><Navigation className="w-4 h-4 mr-2" /> In der Nähe suchen</>}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <p className="text-xs text-muted-foreground">
                            Basierend auf der Analyse von hunderttausenden Patientenerfahrungen.
                        </p>
                    </div>
                </div>
            </section>

            {/* Value Props Section */}
            <section className="container py-12 md:py-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div className="flex flex-col items-center">
                        <Clock className="w-10 h-10 mb-3 text-blue-600" />
                        <h3 className="text-md font-semibold mb-1">Echte Wartezeiten</h3>
                        <p className="text-sm text-muted-foreground">Transparente Einblicke von Patienten für Patienten.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <Heart className="w-10 h-10 mb-3 text-pink-500" />
                        <h3 className="text-md font-semibold mb-1">Freundlichkeit Analyse</h3>
                        <p className="text-sm text-muted-foreground">Wie empathisch wurden Patienten behandelt?</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <Award className="w-10 h-10 mb-3 text-amber-500" />
                        <h3 className="text-md font-semibold mb-1">Kompetenz Einblicke</h3>
                        <p className="text-sm text-muted-foreground">Fachliche Qualität und Behandlungserfolg bewertet.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <CheckCircle className="w-10 h-10 mb-3 text-green-600" />
                        <h3 className="text-md font-semibold mb-1">Umfassender Score</h3>
                        <p className="text-sm text-muted-foreground">Unser Algorithmus bewertet alle relevanten Aspekte.</p>
                    </div>
                </div>
            </section>

            {/* Popular Cities Section - Updated */}
            <section className="bg-gray-50 py-12 md:py-20">
                <div className="container">
                    <h2 className="text-2xl font-bold text-center mb-8">Hautarztsuche in beliebten Städten</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
                        {popularCities.map((city, index) => (
                            <Link key={city.slug} href={`/hautarzt/${city.slug}`} passHref className="block group">
                                <div className="overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow aspect-[4/3] relative bg-gray-200"> {/* Added bg for placeholders */}
                                    <Image
                                        src={city.imageUrl} // Use direct URL
                                        alt={`Hautärzte in ${city.name}`}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 17vw"
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        priority={index < 3}
                                        unoptimized={city.imageUrl.startsWith('/') ? undefined : true}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    <h3 className="absolute bottom-3 left-3 text-white text-lg font-semibold z-10">{city.name}</h3>
                                    {/* Freepik Attribution Overlay */}
                                    {city.attribution === 'freepik' && (
                                        <div className="absolute bottom-1 right-1 z-10 px-1 py-0.5 bg-black/40 rounded-sm">
                                            <span
                                                className="text-[8px] text-white/80 cursor-pointer hover:text-white"
                                                title="Image designed by Freepik"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent card navigation
                                                    window.open('https://www.freepik.com', '_blank', 'noopener,noreferrer');
                                                }}
                                            >
                                                designed by Freepik
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- NEW: Service Info Section --- */}
            {serviceInfoItems.length > 0 && (
                <section className="container py-12 md:py-20">
                    <h2 className="text-2xl font-bold text-center mb-8">Leistungen im Fokus</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {serviceInfoItems.map((item) => (
                            <Card key={item.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader>
                                    {/* Optional Icon Here if needed later */}
                                    <CardTitle className="text-lg">{item.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{item.summary || 'Keine Zusammenfassung verfügbar.'}</p>
                                    {/* Link to a future detail page */}
                                    <Link href={`/leistungen/${item.slug}`} passHref>
                                        <Button variant="link" className="p-0 h-auto text-sm">Mehr erfahren &rarr;</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {/* Link to all services page */}
                    <div className="text-center mt-8">
                        <Link href="/leistungen" passHref>
                            <Button variant="outline">
                                Alle Leistungen anzeigen <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </section>
            )}


            {/* FAQ Section (Uses faqItems prop now) */}
            <section className="container py-12 md:py-20">
                <h2 className="text-2xl font-bold text-center mb-8">Häufige Fragen zum Hautarztbesuch</h2>
                <div className="max-w-3xl mx-auto">
                    <Accordion type="single" collapsible className="w-full">
                        {/* Map over faqItems from props */}
                        {faqItems.map((item, index) => (
                            <AccordionItem value={`item-${index}`} key={item.id}> {/* Use item.id for key */}
                                <AccordionTrigger className="text-left hover:no-underline">
                                    {item.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                                    {/* Render answer content using ReactMarkdown */}
                                    <ReactMarkdown>{item.answer}</ReactMarkdown>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>
        </>
    );
} 