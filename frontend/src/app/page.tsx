'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Shadcn UI / Lucide Imports
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, MapPin, Clock, Heart, ShieldCheck, AlertCircle } from 'lucide-react';

export default function HomePage() {
    // const [searchTerm, setSearchTerm] = useState(''); // Remove searchTerm state
    const [searchCity, setSearchCity] = useState('');
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Remove client-side slug generation and push
        // const city = searchCity.trim();
        // if (city) {
        //     const citySlug = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        //     const url = `/hautarzt/${citySlug}`;
        //     router.push(url);
        // }
        // Instead, let the form submit naturally to the action URL
    };

    const handleLocationClick = () => {
        setError(null);
        if ('geolocation' in navigator) {
            setIsLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // Redirect to the intermediary nearby search page
                    router.push(`/nearby-search`);
                    // Option 1: Specific nearby route
                    // router.push(`/hautarzt/nearby?lat=${latitude}&lon=${longitude}`);
                },
                (err) => {
                    console.error('Geolocation error:', err);
                    setError('Der Standort konnte nicht ermittelt werden. Bitte erteilen Sie die Berechtigung oder versuchen Sie es später erneut.');
                    setIsLoading(false);
                }
            );
        } else {
            setError('Ihr Browser unterstützt keine Standortermittlung. Bitte geben Sie Ihren Ort manuell ein.');
        }
    };

    return (
        <div className="container py-12 md:py-20">
            <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
                    Finden Sie den passenden Hautarzt
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                    mit echten Patienteneinblicken zu Wartezeit, Freundlichkeit und Kompetenz.
                </p>
                {/* Trust Text */}
                <p className="text-sm text-muted-foreground mb-10">
                    Basierend auf der Analyse von hunderttausenden Patientenerfahrungen.
                </p>
            </div>

            {/* Search Form Card */}
            <Card className="max-w-xl mx-auto mb-12">
                <CardHeader>
                    <CardTitle>Praxis finden</CardTitle>
                    {/* <CardDescription>Geben Sie einen Ort ein.</CardDescription> */}
                </CardHeader>
                <CardContent>
                    {/* Update form action to point to the Next.js API proxy route */}
                    <form action="/api/search-redirect" method="GET" className="space-y-4">
                        <div className="space-y-1.5">
                            <Input
                                id="searchCity"
                                name="q" // Ensure input name is 'q'
                                type="text"
                                placeholder="PLZ oder Stadt eingeben"
                                // value={searchCity} // Uncontrolled component now
                                // onChange={(e) => setSearchCity(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        {/* Remove General Search Term Input */}
                        {/* 
                        <div className="space-y-1.5">
                            <Label htmlFor="searchTerm">...</Label>
                            <Input id="searchTerm" ... />
                        </div> 
                        */}

                        {error && (
                            <Alert variant="destructive" className="text-xs">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            {/* Primary Search Button */}
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Suche läuft...' : <><Search className="w-4 h-4 mr-2" /> Hautärzte finden</>}
                            </Button>
                            {/* Secondary/Outline Location Button */}
                            <Button
                                type="button"
                                variant="outline" // Ensure outline variant
                                className="w-full"
                                onClick={handleLocationClick}
                                disabled={isLoading}
                            >
                                <MapPin className="w-4 h-4 mr-2" /> Meinen Standort nutzen
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card className="text-center">
                    <CardHeader>
                        <div className="flex justify-center mb-3">
                            <Clock className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Wartezeit-Einblicke</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Erfahren Sie, wie lange andere Patienten im Durchschnitt gewartet haben.
                    </CardContent>
                </Card>
                <Card className="text-center">
                    <CardHeader>
                        <div className="flex justify-center mb-3">
                            <Heart className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Freundlichkeit</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Wie empathisch und zugewandt wurden Patienten behandelt?
                    </CardContent>
                </Card>
                <Card className="text-center">
                    <CardHeader>
                        <div className="flex justify-center mb-3">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Kompetenz & Behandlung</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Einblicke in die fachliche Qualität und den Behandlungserfolg.
                    </CardContent>
                </Card>
            </div>

            {/* Popular Cities */}
            <div className="text-center">
                <h3 className="mb-4 text-lg font-semibold">Beliebte Städte</h3>
                <div className="flex flex-wrap justify-center gap-3">
                    {['berlin', 'hamburg', 'muenchen', 'koeln', 'frankfurt'].map(citySlug => (
                        <Link key={citySlug} href={`/hautarzt/${citySlug}`} passHref>
                            <Button variant="ghost" size="sm">
                                {citySlug.charAt(0).toUpperCase() + citySlug.slice(1).replace('-', ' ')}
                            </Button>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
} 