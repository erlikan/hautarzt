'use client';

import { useMemo } from 'react';
// Shadcn UI Imports
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription // Optional
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Import Tooltip components
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface AspectAnalysisCardProps {
    title: string;
    positiveValue: number | null;
    neutralValue: number | null;
    negativeValue: number | null;
    icon?: React.ReactNode;
}

export default function AspectAnalysisCard({
    title,
    positiveValue = 0,
    neutralValue = 0,
    negativeValue = 0,
    icon
}: AspectAnalysisCardProps) {
    // Calculation logic (total, percentages, dominantSentiment, summaryText) remains the same
    // ... (existing useMemo hooks) ...
    const total = useMemo(() => {
        return (positiveValue || 0) + (neutralValue || 0) + (negativeValue || 0);
    }, [positiveValue, neutralValue, negativeValue]);

    const positivePercentage = useMemo(() => {
        return total > 0 ? Math.round(((positiveValue || 0) / total) * 100) : 0;
    }, [positiveValue, total]);

    const neutralPercentage = useMemo(() => {
        return total > 0 ? Math.round(((neutralValue || 0) / total) * 100) : 0;
    }, [neutralValue, total]);

    const negativePercentage = useMemo(() => {
        return total > 0 ? Math.round(((negativeValue || 0) / total) * 100) : 0;
    }, [negativeValue, total]);

    const dominantSentiment = useMemo(() => {
        if (!total || total === 0) return 'neutral'; // Default to neutral if no data
        const sentiments = [
            { type: 'positive', value: positivePercentage },
            { type: 'negative', value: negativePercentage },
            { type: 'neutral', value: neutralPercentage },
        ];
        // Sort by value descending, then handle ties (e.g., positive > neutral > negative)
        sentiments.sort((a, b) => b.value - a.value || (a.type === 'positive' ? -1 : b.type === 'positive' ? 1 : 0) || (a.type === 'neutral' ? -1 : b.type === 'neutral' ? 1 : 0));
        return sentiments[0].type as 'positive' | 'neutral' | 'negative';
    }, [positivePercentage, neutralPercentage, negativePercentage, total]);

    const summaryText = useMemo(() => {
        if (total === 0) return 'Keine Daten';

        if (dominantSentiment === 'positive' && positivePercentage >= 70) {
            return 'Sehr positiv';
        } else if (dominantSentiment === 'positive') {
            return 'Eher positiv';
        } else if (dominantSentiment === 'negative' && negativePercentage >= 70) {
            return 'Sehr negativ';
        } else if (dominantSentiment === 'negative') {
            return 'Eher negativ';
        } else {
            return 'Gemischt';
        }
    }, [dominantSentiment, positivePercentage, negativePercentage, total]);

    const summaryVariant = useMemo(() => {
        if (total === 0) return 'secondary';
        switch (dominantSentiment) {
            case 'positive': return 'default'; // Use primary color for positive
            case 'negative': return 'destructive';
            default: return 'secondary'; // Use secondary for neutral/mixed
        }
    }, [dominantSentiment, total]);


    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    {icon && <span className="text-muted-foreground">{icon}</span>}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
                {total > 0 ? (
                    <div className="space-y-2">
                        {/* Stacked Bar */}
                        <div className="flex w-full h-2 rounded-full overflow-hidden bg-muted">
                            <div title={`Positiv: ${positivePercentage}%`} className="bg-aspect-positive" style={{ width: `${positivePercentage}%` }}></div>
                            <div title={`Neutral: ${neutralPercentage}%`} className="bg-aspect-neutral" style={{ width: `${neutralPercentage}%` }}></div>
                            <div title={`Negativ: ${negativePercentage}%`} className="bg-aspect-negative" style={{ width: `${negativePercentage}%` }}></div>
                        </div>
                        {/* Summary Text (with Tooltip explaining context) + Count removed */}
                        <div className="text-xs text-muted-foreground flex justify-center items-center pt-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className={`cursor-help font-medium ${dominantSentiment === 'positive' ? 'text-green-700' :
                                            dominantSentiment === 'negative' ? 'text-red-700' :
                                                'text-gray-600'
                                        }`}>{summaryText}</span>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    <p>Zusammenfassende Einschätzung basierend auf {total} relevanten Erwähnungen.</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                ) : (
                    <div className="pt-1 pb-1 text-center text-xs text-muted-foreground italic">
                        Keine Daten
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
