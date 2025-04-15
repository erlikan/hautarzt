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
import { Phone, Globe, ExternalLink, Star, Accessibility, CreditCard, Wifi, ParkingCircle, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useMemo } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
// Import constants
import { CORE_DERMATOLOGY_IDENTIFIERS } from '@/lib/constants';

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

export default function PraxisHeader({ praxis }: PraxisHeaderProps) {
    const formattedScore = praxis.analysis?.overall_score?.toFixed(1) ?? 'N/A';
    const scoreVariant = getScoreVariant(praxis.analysis?.overall_score);
    const formattedPhone = praxis.phone?.replace(/\s/g, '');
    const appointmentLink = praxis.booking_appointment_link || praxis.site;
    const isCoreDermatology = praxis.category === 'Hautarzt' ||
        (praxis.subtypes && praxis.subtypes.some(sub => CORE_DERMATOLOGY_IDENTIFIERS.has(sub)));

    const handleAppointmentClick = () => {
        if (appointmentLink) {
            window.open(appointmentLink, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        // Card container - no longer full grid with image
        <Card className="overflow-hidden mb-6 border shadow-sm">
            <div className="flex flex-col md:flex-row">
                {/* Left Column: Main Info (takes more space) */}
                <div className="p-5 md:p-6 flex-grow md:w-2/3">
                    {/* Badge/Category */}
                    <div className="mb-2">
                        {isCoreDermatology ? (
                            <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2 py-0.5 rounded-md">
                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Facharzt für Dermatologie
                            </Badge>
                        ) : (
                            praxis.category && <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{praxis.category}</span>
                        )}
                    </div>

                    {/* Name */}
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-gray-900 mb-1">{praxis.name}</h1>

                    {/* Address */}
                    <p className="text-muted-foreground mb-3 text-sm sm:text-base">
                        {praxis.full_address}
                        {praxis.located_in && <span className="block text-xs">({praxis.located_in})</span>}
                    </p>

                    {/* Score & Rating Row */}
                    <div className="flex items-center gap-4 mb-4">
                        {/* Overall Score */}
                        {praxis.analysis?.overall_score != null && (
                            <div className="text-lg font-medium flex items-center gap-1">
                                <span className="text-gray-700">Score:</span>
                                <span className={`text-xl font-semibold ${scoreVariant === 'default' ? 'text-emerald-600' :
                                    scoreVariant === 'destructive' ? 'text-red-600' :
                                        scoreVariant === 'outline' ? 'text-amber-600' :
                                            'text-gray-500'
                                    }`}>{formattedScore}
                                </span>
                                <span className="text-xs text-muted-foreground">/ 100</span>
                            </div>
                        )}
                        {/* Google Rating (Optional) */}
                        {praxis.rating != null && praxis.reviews != null && praxis.reviews > 0 && (
                            <div className="flex items-center text-sm text-gray-600">
                                <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                                <span className="font-medium mr-1">{praxis.rating.toFixed(1)}</span>
                                ({praxis.reviews} Google)
                            </div>
                        )}
                    </div>

                    {/* Contact Row: Phone & Buttons - REMOVE THIS SECTION */}
                    {/* 
                    <div className="flex flex-wrap items-center gap-3">
                        {praxis.phone && ( ... phone link ... )}
                        {appointmentLink && ( ... appointment button ... )}
                        {praxis.site && ( ... website button ... )}
                    </div> 
                    */}

                </div>

                {/* Right Column: Image (takes less space) */}
                <div className="md:w-1/3 relative min-h-[200px] md:min-h-full bg-muted flex-shrink-0">
                    {praxis.photo ? (
                        <Image
                            src={praxis.photo}
                            alt={`Bild von ${praxis.name}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            priority // Prioritize header image
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
