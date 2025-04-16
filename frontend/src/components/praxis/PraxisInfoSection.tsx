'use client';

import { PraxisDetail } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from 'next/image';
import { Clock, Image as ImageIcon, Accessibility, MapPin, Phone, Globe, Navigation, CreditCard, Wifi, ParkingCircle, CheckSquare, ExternalLink } from 'lucide-react';
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
    // console.log('Raw working_hours data:', praxis.working_hours);

    const openingHours = parseOpeningHours(praxis.working_hours);
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(praxis.full_address || `${praxis.name}, ${praxis.city}`)}`;
    const formattedPhone = praxis.phone?.replace(/\s/g, '');
    // Use appointment link or website for primary button
    const appointmentLink = praxis.booking_appointment_link || praxis.site;

    const aboutEntries = useMemo(() => {
        const entries: { key: string, value: boolean | string }[] = [];
        if (!praxis.about || typeof praxis.about !== 'object') return entries;
        const checkCategory = (categoryKey: string) => {
            if (praxis.about[categoryKey] && typeof praxis.about[categoryKey] === 'object') {
                Object.entries(praxis.about[categoryKey]).forEach(([key, value]) => {
                    // Only include if true or a non-empty string, and we have an icon
                    if ((value === true || (typeof value === 'string' && value.trim() !== '')) && aboutIconMap.hasOwnProperty(key)) {
                        entries.push({ key: key, value: value });
                    }
                });
            }
        };
        checkCategory("Barrierefreiheit");
        checkCategory("Ausstattung");
        checkCategory("Zahlungsoptionen");
        return entries;
    }, [praxis.about]);

    const handleAppointmentClick = () => {
        if (appointmentLink) {
            window.open(appointmentLink, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* REMOVE Separate About Icons Card */}
                {/* {aboutEntries.length > 0 && ( ... )} */}

                {/* Main Contact & Info Card */}
                <Card>
                    {/* Remove CardHeader for a cleaner look? Or keep simple title? */}
                    {/* <CardHeader><CardTitle>Kontakt & Info</CardTitle></CardHeader> */}
                    <CardContent className="p-4 md:p-5">
                        {/* Map Section */}
                        <div className="mb-3 h-48 md:h-52 rounded-md overflow-hidden border bg-muted">
                            <PraxisMap
                                name={praxis.name}
                                latitude={praxis.latitude ?? null}
                                longitude={praxis.longitude ?? null}
                                address={praxis.full_address ?? ''}
                            />
                        </div>
                        {/* Address & Directions */}
                        <div className="mb-4">
                            <h4 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-gray-500" /> Adresse
                            </h4>
                            <p className="text-sm text-muted-foreground pl-6">
                                {praxis.full_address || 'Adresse nicht verfügbar'}
                                {praxis.located_in && <span className="block text-xs">({praxis.located_in})</span>}
                            </p>
                            <Button variant="link" size="sm" className="h-auto p-0 pl-6 text-xs mt-1" asChild>
                                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                                    Anfahrt planen <Navigation className="w-3 h-3 ml-1" />
                                </a>
                            </Button>
                        </div>

                        {/* Contact: Phone / Website / Booking - ADDED */}
                        <div className="mb-4 pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                                <Phone className="w-4 h-4 text-gray-500" /> Kontakt
                            </h4>
                            <div className="space-y-2 pl-6">
                                {praxis.phone && (
                                    <a href={`tel:${formattedPhone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                                        <Phone className="w-3.5 h-3.5" /> {praxis.phone}
                                    </a>
                                )}
                                {praxis.site && (
                                    <a href={praxis.site} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                                        <Globe className="w-3.5 h-3.5" /> Website besuchen
                                    </a>
                                )}
                                {appointmentLink && (
                                    <Button size="sm" onClick={handleAppointmentClick} className="text-white bg-blue-600 hover:bg-blue-700 h-8 mt-1">
                                        Online Termin
                                        <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                                    </Button>
                                )}
                                {!praxis.phone && !praxis.site && !appointmentLink && (
                                    <p className="text-sm text-muted-foreground italic">Keine Kontaktlinks verfügbar.</p>
                                )}
                            </div>
                        </div>

                        {/* Opening Hours */}
                        <div className="mb-4 pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-gray-500" />
                                Öffnungszeiten
                            </h4>
                            {openingHours ? (
                                <Table className="text-xs">
                                    {/* Removed TableHeader for simplicity */}
                                    <TableBody>
                                        {openingHours.map((item, index) => (
                                            <TableRow key={index} className="border-0">
                                                <TableCell className="font-medium py-1 px-0 pl-6 w-[80px]">{item.day}</TableCell>
                                                <TableCell className="py-1 px-0">{item.hours}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-sm text-muted-foreground pl-6">
                                    Öffnungszeiten nicht verfügbar.
                                </p>
                            )}
                        </div>

                        {/* About / Merkmale - INTEGRATED */}
                        {aboutEntries.length > 0 && (
                            <div className="pt-4 border-t">
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                                    {/* Use a relevant icon like CheckSquare or Info? */}
                                    <CheckSquare className="w-4 h-4 text-gray-500" />
                                    Ausstattung & Merkmale
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-6">
                                    {aboutEntries.map((entry) => {
                                        const icon = aboutIconMap[entry.key];
                                        return (
                                            <Tooltip key={entry.key}>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                        {/* Conditionally render icon */}
                                                        {icon && <span className="inline-block w-4 h-4">{icon}</span>}
                                                        <span>{entry.key}</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top"><p>{entry.key}</p></TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
} 