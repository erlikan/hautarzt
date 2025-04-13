'use client';

import { PraxisDetail } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from 'next/image';
import { Clock, Image as ImageIcon, Accessibility, MapPin, Phone, Globe, Navigation, CreditCard, Wifi, ParkingCircle } from 'lucide-react';
import PraxisMap from './PraxisMap';
import { Button } from "@/components/ui/button";
import { useMemo } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface PraxisInfoSectionProps {
    praxis: PraxisDetail;
}

// Helper type for parsed opening hours
type ParsedOpeningHours = {
    day: string;
    hours: string;
}[];

// Updated parser for working_hours object
function parseOpeningHours(workingHours: any): ParsedOpeningHours | null {
    if (!workingHours || typeof workingHours !== 'object' || Array.isArray(workingHours) || Object.keys(workingHours).length === 0) {
        return null;
    }

    // Define desired day order
    const dayOrder = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

    try {
        const parsed: ParsedOpeningHours = [];
        // Iterate over desired day order first
        for (const day of dayOrder) {
            if (workingHours.hasOwnProperty(day)) {
                parsed.push({ day: day, hours: workingHours[day] || 'N/A' });
            }
        }
        // Add any remaining days from the object that weren't in dayOrder (just in case)
        for (const day in workingHours) {
            if (workingHours.hasOwnProperty(day) && !dayOrder.includes(day)) {
                console.warn(`Found unexpected day key in workingHours: ${day}`);
                parsed.push({ day: day, hours: workingHours[day] || 'N/A' });
            }
        }

        return parsed.length > 0 ? parsed : null;

    } catch (error) {
        console.error('Error parsing opening hours object:', error, 'Data:', workingHours);
        return null;
    }
}

// Define icons for specific keys in the 'about' JSON (Copied from Header)
const aboutIconMap: Record<string, React.ReactNode> = {
    "Rollstuhlgerechter Eingang": <Accessibility className="w-4 h-4" />,
    "Rollstuhlgerechtes WC": <Accessibility className="w-4 h-4 text-blue-600" />,
    "Rollstuhlgerechter Parkplatz": <ParkingCircle className="w-4 h-4" />,
    "WC": <Accessibility className="w-4 h-4" />,
    "WLAN": <Wifi className="w-4 h-4" />,
    "Akzeptiert Kreditkarten": <CreditCard className="w-4 h-4" />,
}

export default function PraxisInfoSection({ praxis }: PraxisInfoSectionProps) {
    // Log the raw working hours data to understand its structure
    console.log('Raw working_hours data:', praxis.working_hours);

    const openingHours = parseOpeningHours(praxis.working_hours);

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(praxis.full_address)}`;

    const aboutEntries = useMemo(() => {
        const entries: { key: string, value: boolean | string }[] = [];
        if (!praxis.about || typeof praxis.about !== 'object') return entries;
        const checkCategory = (categoryKey: string) => {
            if (praxis.about[categoryKey] && typeof praxis.about[categoryKey] === 'object') {
                Object.entries(praxis.about[categoryKey]).forEach(([key, value]) => {
                    if (value === true || (typeof value === 'string' && value.trim() !== '')) {
                        if (aboutIconMap.hasOwnProperty(key)) {
                            entries.push({ key: key, value: value });
                        }
                    }
                });
            }
        };
        checkCategory("Barrierefreiheit");
        checkCategory("Ausstattung");
        checkCategory("Zahlungsoptionen");
        return entries;
    }, [praxis.about]);

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* About Icons Card FIRST */}
                {aboutEntries.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium">Merkmale</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap items-center gap-3">
                                {aboutEntries.map((entry) => {
                                    const icon = aboutIconMap[entry.key];
                                    return (
                                        <Tooltip key={entry.key}>
                                            <TooltipTrigger asChild>
                                                <span className="text-muted-foreground">{icon}</span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top"><p>{entry.key}</p></TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Correct Contact Card (Map first, then Opening Hours, NO website link) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Kontakt & Öffnungszeiten
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Map Section FIRST */}
                        <div className="mb-2 h-44 rounded-md overflow-hidden border bg-muted">
                            <PraxisMap
                                name={praxis.name}
                                latitude={praxis.latitude}
                                longitude={praxis.longitude}
                                address={praxis.full_address}
                            />
                        </div>
                        {/* Directions Link Directly Below Map */}
                        <div className="mb-6">
                            <Button variant="outline" size="sm" asChild>
                                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                                    <Navigation className="w-4 h-4 mr-2" /> Anfahrt planen
                                </a>
                            </Button>
                        </div>

                        {/* Opening Hours Table SECOND */}
                        <div className="pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Öffnungszeiten
                            </h4>
                            {openingHours ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Tag</TableHead>
                                            <TableHead>Zeiten</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {openingHours.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{item.day}</TableCell>
                                                <TableCell>{item.hours}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Öffnungszeiten nicht verfügbar. Bitte kontaktieren Sie die Praxis.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
} 