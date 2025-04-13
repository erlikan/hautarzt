'use client';

import { PraxisDetail } from '@/types';
import dynamic from 'next/dynamic';
// Shadcn UI / Lucide Imports
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Globe, ExternalLink, Star, Accessibility, CreditCard, Wifi, ParkingCircle } from 'lucide-react';
import Image from 'next/image';
import { useMemo } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface PraxisHeaderProps {
    praxis: PraxisDetail;
}

/**
 * Gets the appropriate color class based on the score value
 */
function getScoreVariant(score: number | null | undefined): "default" | "secondary" | "destructive" | "outline" {
    if (score === null || score === undefined) return 'secondary'; // Use secondary for unknown/N/A
    if (score >= 70) return 'default'; // Use default (primary) for high scores
    if (score >= 40) return 'outline'; // Use outline for medium scores
    return 'destructive'; // Use destructive for low scores
}

// Define icons for specific keys in the 'about' JSON
const aboutIconMap: Record<string, React.ReactNode> = {
    // Keys from Barrierefreiheit
    "Rollstuhlgerechter Eingang": <Accessibility className="w-4 h-4" />,
    "Rollstuhlgerechtes WC": <Accessibility className="w-4 h-4 text-blue-600" />,
    "Rollstuhlgerechter Parkplatz": <ParkingCircle className="w-4 h-4" />, // Example icon for parking
    // Keys from Ausstattung
    "WC": <Accessibility className="w-4 h-4" />, // Re-using Accessibility for generic WC
    "WLAN": <Wifi className="w-4 h-4" />,
    // Keys from Payments
    "Akzeptiert Kreditkarten": <CreditCard className="w-4 h-4" />,
    // Add more based on common keys observed in the actual data
}

export default function PraxisHeader({ praxis }: PraxisHeaderProps) {
    // Format the score with one decimal place
    const formattedScore = praxis.analysis?.overall_score != null
        ? praxis.analysis.overall_score.toFixed(1)
        : 'N/A';

    // Get color class based on score
    const scoreVariant = getScoreVariant(praxis.analysis?.overall_score);

    // Format phone number (remove spaces) for tel: link
    const formattedPhone = praxis.phone?.replace(/\s/g, '');

    // Determine the correct link for appointment booking
    const appointmentLink = praxis.booking_appointment_link || praxis.site;

    // Handle appointment button click using the determined link
    const handleAppointmentClick = () => {
        if (appointmentLink) {
            window.open(appointmentLink, '_blank', 'noopener,noreferrer');
        }
    };

    // Log the about data
    // console.log("Praxis About Data:", praxis.about);

    return (
        <Card className="overflow-hidden mb-8">
            <div className="md:grid md:grid-cols-3">
                {/* Left column (col-span-2): Details */}
                <div className="p-6 md:col-span-2">
                    <div className="flex items-start justify-between gap-4 mb-1">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{praxis.name}</h1>
                    </div>
                    <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                        {praxis.full_address}
                        {praxis.located_in && <span className="block text-xs">({praxis.located_in})</span>}
                    </p>

                    {/* Phone - Moved Before Score */}
                    {praxis.phone && (
                        <div className="mb-4">
                            <a
                                href={`tel:${formattedPhone}`}
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                                <Phone className="w-4 h-4" />
                                {praxis.phone}
                            </a>
                        </div>
                    )}

                    {/* Score Display - Moved After Phone */}
                    {praxis.analysis?.overall_score != null && (
                        <div className="mb-6 text-lg font-medium">
                            <span className="text-muted-foreground">Gesamtscore: </span>
                            <span className={`text-2xl font-semibold ${scoreVariant === 'default' ? 'text-green-600' :
                                scoreVariant === 'destructive' ? 'text-red-600' :
                                    scoreVariant === 'outline' ? 'text-yellow-600' :
                                        'text-gray-500'
                                }`}>{formattedScore}</span>
                            <span className="text-sm text-muted-foreground"> / 100</span>
                        </div>
                    )}

                    {/* Display About Icons */}
                    {/* ... about icons ... */}

                    {/* Appointment & Website Buttons */}
                    <div className="flex flex-wrap gap-3">
                        {/* Use appointmentLink for booking button */}
                        {appointmentLink && (
                            <Button size="lg" onClick={handleAppointmentClick}>
                                Online Termin vereinbaren
                                <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                        {/* Website button remains the same */}
                        {praxis.site && (
                            <Button variant="outline" asChild>
                                <a href={praxis.site} target="_blank" rel="noopener noreferrer">
                                    <Globe className="w-4 h-4 mr-2" /> Website besuchen
                                </a>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Right column (col-span-1): Image */}
                <div className="md:col-span-1 relative h-48 md:h-auto bg-muted">
                    {/* Display praxis.photo if available */}
                    {praxis.photo ? (
                        <Image
                            src={praxis.photo}
                            alt={`Bild von ${praxis.name}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            priority
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">Kein Bild verfügbar</span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
