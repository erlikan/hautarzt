'use client'; // <<< Add this directive

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Shadcn UI / Lucide Imports
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, MapPin, Clock, Heart, ShieldCheck, AlertCircle, Navigation, CheckCircle, Smile, Award, ChevronRight } from 'lucide-react';
import Image from 'next/image';
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
        console.log('[HomePageClientContent] Initial FAQ Items Prop:', initialFaqItems);
        console.log('[HomePageClientContent] Initial Service Info Prop:', initialServiceInfoItems);
    }, [initialFaqItems, initialServiceInfoItems]); // Run only when props change

    const router = useRouter();
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Assign props to local constants
    const faqItems = initialFaqItems;
    const serviceInfoItems = initialServiceInfoItems;

    const handleLocationClick = () => {
        setError(null);
        if ('geolocation' in navigator) {
            setIsLoadingLocation(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    router.push(`/hautarzt/nearby?lat=${latitude}&lon=${longitude}`);
                    setIsLoadingLocation(false);
                },
                (err) => {
                    console.error('Geolocation error:', err);
                    setError('Der Standort konnte nicht ermittelt werden. Bitte erteilen Sie die Berechtigung oder versuchen Sie es später erneut.');
                    setIsLoadingLocation(false);
                }
            );
        } else {
            setError('Ihr Browser unterstützt keine Standortermittlung. Bitte geben Sie Ihren Ort manuell ein.');
        }
    };

    const handleNearbySearchClick = () => {
        handleLocationClick();
    }

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

                        {/* Search Form Card - Enhanced */}
                        <Card className="max-w-2xl mx-auto mb-6 shadow-lg">
                            <CardContent className="p-5 md:p-6">
                                <form action="/api/search-redirect" method="GET" className="space-y-4">
                                    <div>
                                        <Label htmlFor="searchLocation" className="sr-only">PLZ oder Stadt</Label>
                                        <Input
                                            id="searchLocation"
                                            name="q" // Name used by action
                                            type="text"
                                            placeholder="PLZ oder Stadt eingeben..."
                                            disabled={isLoadingLocation}
                                            required
                                            className="text-base py-3 px-4"
                                        />
                                    </div>

                                    {error && (
                                        <Alert variant="destructive" className="text-xs">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <Button type="submit" size="lg" className="w-full text-base">
                                            <Search className="w-4 h-4 mr-2" /> Hautärzte finden
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="lg"
                                            className="w-full text-base"
                                            onClick={handleNearbySearchClick} // Changed action
                                            disabled={isLoadingLocation}
                                        >
                                            {isLoadingLocation ? 'Standort wird ermittelt...' : <><Navigation className="w-4 h-4 mr-2" /> In der Nähe suchen</>}
                                        </Button>
                                    </div>
                                </form>
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