'use client';

import { PraxisAnalysisData } from '@/types';
import AspectAnalysisCard from './AspectAnalysisCard';
// Shadcn UI / Lucide Imports
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    TrendingUp, TrendingDown, Minus,
    ThumbsUp, ThumbsDown, CheckCircle, XCircle,
    Tags, Smile, User,
    Clock, Heart, MessageCircle, Award, Home,
    Users, Info, ClipboardList,
    ChevronsUpDown,
    ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useState } from 'react';

interface KiDashboardProps {
    analysisData: PraxisAnalysisData;
}

// Map aspect keys to Lucide icons
const aspectIconsMap: Record<string, React.ReactNode> = {
    termin: <Clock className="w-4 h-4" />,
    freundlichkeit: <Heart className="w-4 h-4" />,
    aufklaerung: <MessageCircle className="w-4 h-4" />,
    kompetenz: <Award className="w-4 h-4" />,
    praxis: <Home className="w-4 h-4" />,
};

export default function KiDashboard({ analysisData }: KiDashboardProps) {
    const [isTrendExpanded, setIsTrendExpanded] = useState(false);

    // Helper to get trend icon and variant
    const getTrendDisplay = () => {
        if (!analysisData.trend) return { icon: <Minus className="w-4 h-4" />, type: 'neutral', text: 'Neutral' };
        const trendLower = analysisData.trend.toLowerCase();
        if (trendLower.includes('positiv')) {
            return { icon: <TrendingUp className="w-4 h-4" />, type: 'positive', text: 'Positiv' };
        } else if (trendLower.includes('negativ')) {
            return { icon: <TrendingDown className="w-4 h-4" />, type: 'destructive', text: 'Negativ' };
        } else {
            return { icon: <Minus className="w-4 h-4" />, type: 'neutral', text: 'Neutral' };
        }
    };

    // Helper to render tags as Badges
    const renderTags = (tags: string[] | null | undefined, variant: "default" | "secondary" | "destructive" | "outline" = "secondary") => {
        if (!tags || tags.length === 0) return null;
        return (
            <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                    <Badge key={index} variant={variant}>{tag}</Badge>
                ))}
            </div>
        );
    };

    const trendDisplay = getTrendDisplay();

    return (
        // Use Card as the main container
        <Card>
            <CardHeader>
                <CardTitle>Patienten-Einblicke</CardTitle>
                <CardDescription>
                    Analyse basierend auf Patientenbewertungen und öffentlichen Daten.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Aspect Analysis Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AspectAnalysisCard
                        title="Termin/Wartezeit"
                        positiveValue={analysisData.termin_wartezeit_positiv ?? null}
                        neutralValue={analysisData.termin_wartezeit_neutral ?? null}
                        negativeValue={analysisData.termin_wartezeit_negativ ?? null}
                        icon={aspectIconsMap.termin}
                    />
                    <AspectAnalysisCard
                        title="Freundlichkeit"
                        positiveValue={analysisData.freundlichkeit_empathie_positiv ?? null}
                        neutralValue={analysisData.freundlichkeit_empathie_neutral ?? null}
                        negativeValue={analysisData.freundlichkeit_empathie_negativ ?? null}
                        icon={aspectIconsMap.freundlichkeit}
                    />
                    <AspectAnalysisCard
                        title="Aufklärung/Vertrauen"
                        positiveValue={analysisData.aufklaerung_vertrauen_positiv ?? null}
                        neutralValue={analysisData.aufklaerung_vertrauen_neutral ?? null}
                        negativeValue={analysisData.aufklaerung_vertrauen_negativ ?? null}
                        icon={aspectIconsMap.aufklaerung}
                    />
                    <AspectAnalysisCard
                        title="Kompetenz"
                        positiveValue={analysisData.kompetenz_behandlung_positiv ?? null}
                        neutralValue={analysisData.kompetenz_behandlung_neutral ?? null}
                        negativeValue={analysisData.kompetenz_behandlung_negativ ?? null}
                        icon={aspectIconsMap.kompetenz}
                    />
                    <AspectAnalysisCard
                        title="Praxis/Ausstattung"
                        positiveValue={analysisData.praxis_ausstattung_positiv ?? null}
                        neutralValue={analysisData.praxis_ausstattung_neutral ?? null}
                        negativeValue={analysisData.praxis_ausstattung_negativ ?? null}
                        icon={aspectIconsMap.praxis}
                    />

                    {/* Trend Section - Render as a Card, toggle line-clamp */}
                    {analysisData.trend && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    {trendDisplay.icon}
                                    Trend: {trendDisplay.text}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 pb-4">
                                {analysisData.trend_begruendung ? (
                                    <>
                                        <p className={`text-xs ${trendDisplay.type === 'destructive' ? 'text-destructive' : 'text-muted-foreground'} ${isTrendExpanded ? '' : 'line-clamp-2'}`}>
                                            {analysisData.trend_begruendung}
                                        </p>
                                        {/* Show toggle button only if text is potentially clamped (needs better check ideally) */}
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="p-0 h-auto text-xs mt-1"
                                            onClick={() => setIsTrendExpanded(!isTrendExpanded)}
                                        >
                                            {isTrendExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                                            {isTrendExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                                        </Button>
                                    </>
                                ) : (
                                    <p className="text-xs italic text-muted-foreground">Keine Begründung verfügbar.</p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Strengths and Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <Alert className="border-green-300 bg-green-50/50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Stärken</AlertTitle>
                        <AlertDescription className="text-green-700">
                            {analysisData.staerken && analysisData.staerken.length > 0 ? (
                                <ul className="mt-2 space-y-1 list-disc list-inside">
                                    {analysisData.staerken.map((strength, index) => (
                                        <li key={index}>{strength}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-2 italic">Keine spezifischen Stärken identifiziert.</p>
                            )}
                        </AlertDescription>
                    </Alert>

                    {/* Weaknesses */}
                    <Alert variant="destructive" className="bg-red-50/50">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Schwächen</AlertTitle>
                        <AlertDescription>
                            {analysisData.schwaechen && analysisData.schwaechen.length > 0 ? (
                                <ul className="mt-2 space-y-1 list-disc list-inside">
                                    {analysisData.schwaechen.map((weakness, index) => (
                                        <li key={index}>{weakness}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-2 italic">Keine spezifischen Schwächen identifiziert.</p>
                            )}
                        </AlertDescription>
                    </Alert>
                </div>

                {/* Additional Info Sections */}
                <div className="space-y-4">
                    {/* Tags */}
                    {analysisData.tags && analysisData.tags.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-1 flex items-center gap-2 text-muted-foreground"><Tags className="w-4 h-4" />Häufige Themen</h4>
                            {renderTags(analysisData.tags, "secondary")}
                        </div>
                    )}

                    {/* Emotional tags */}
                    {analysisData.emotionale_tags && analysisData.emotionale_tags.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-1 flex items-center gap-2 text-muted-foreground"><Smile className="w-4 h-4" />Typische Emotionen</h4>
                            {renderTags(analysisData.emotionale_tags, "outline")}
                        </div>
                    )}

                    {/* Doctors mentioned */}
                    {analysisData.mentioned_doctors && analysisData.mentioned_doctors.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-1 flex items-center gap-2 text-muted-foreground"><User className="w-4 h-4" />Erwähnte Ärzte</h4>
                            {renderTags(analysisData.mentioned_doctors, "outline")}
                        </div>
                    )}

                    {/* Kasse/Privat comparison */}
                    {analysisData.vergleich_kasse_privat && (
                        <Alert className="bg-muted">
                            <Users className="h-4 w-4" />
                            <AlertTitle>Kasse / Privatpatienten</AlertTitle>
                            <AlertDescription>{analysisData.vergleich_kasse_privat}</AlertDescription>
                        </Alert>
                    )}
                </div>

            </CardContent>
        </Card>
    );
}
