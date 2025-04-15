'use client';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Check, HeartPulse, Microscope, Siren, Stethoscope, Syringe, Users, Sparkles, PersonStanding } from 'lucide-react';

// Simple mapping from lowercase keyword/name to a Lucide icon component
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    // Subtypes
    'hautarzt': Microscope, // Placeholder, maybe something better?
    'allergologe': FlaskConical, // Allergy test often involves lab?
    'venerologe': HeartPulse, // Related to health
    'kinderdermatologe': Users,
    'plastischer chirurg': Sparkles, // Aesthetics
    'phlebologie': HeartPulse, // Veins -> Circulation
    'proktologie': PersonStanding, // General representation
    'podologe': PersonStanding,
    'fußpflege': PersonStanding,
    // Services
    'hautkrebsvorsorge': Microscope, // Screening/Microscope
    'laser': Sparkles, // Often cosmetic/precise
    'allergietest': FlaskConical,
    'akne': Sparkles, // Often treated cosmetically
    'ästhetik': Sparkles,
    'botox': Syringe,
    'filler': Syringe,
    'operation': Stethoscope, // Generic medical procedure
    'labor': FlaskConical,
    // Add more as needed
};

// Helper to get an icon
const getIconForTerm = (term: string): React.ComponentType<{ className?: string }> | null => {
    const lowerTerm = term.toLowerCase();
    for (const keyword in iconMap) {
        if (lowerTerm.includes(keyword)) {
            return iconMap[keyword];
        }
    }
    return null; // No specific icon found
};

// Define a simple interface for the service object expected
interface ServiceObject {
    name: string;
    id?: number; // Ensure id is optional if not always present
    // Allow other properties if they exist (e.g., id)
    [key: string]: any;
}

interface LeistungenSectionProps {
    // Expect an array of ServiceObject or null
    services: ServiceObject[] | null;
    // Add subtypes prop
    subtypes: string[] | null;
}

export default function LeistungenSection({ services, subtypes }: LeistungenSectionProps) {
    // Determine if there's anything to show
    const hasServices = services && services.length > 0;
    const hasSubtypes = subtypes && subtypes.length > 0;
    const relevantSubtypes = subtypes?.filter(st => !['Arzt', 'Arztpraxis', 'Service establishment'].includes(st)) || [];
    const hasRelevantSubtypes = relevantSubtypes.length > 0;

    if (!hasServices && !hasRelevantSubtypes) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Leistungen & Spezialisierungen</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Keine spezifischen Leistungs- oder Fokusdaten verfügbar.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Leistungen & Spezialisierungen</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Display Subtypes First (if relevant ones exist) */}
                {hasRelevantSubtypes && (
                    <div className="mb-5 pb-4 border-b border-gray-100">
                        <h4 className="text-base font-semibold mb-2 text-gray-700">Fokus / Spezialisierung</h4>
                        <div className="flex flex-wrap gap-2">
                            {relevantSubtypes.map((subtype, index) => {
                                const IconComponent = getIconForTerm(subtype);
                                return (
                                    <Badge key={`subtype-${index}`} variant="outline" className="text-sm border-blue-300 bg-blue-50 text-blue-800 font-medium px-2.5 py-1 inline-flex items-center">
                                        {IconComponent && <IconComponent className="w-3.5 h-3.5 mr-1.5 opacity-80" />}
                                        {subtype}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Display Services Second (if they exist) */}
                {hasServices && (
                    <div className="mb-6">
                        <h4 className="text-base font-semibold mb-2 text-gray-700">Angebotene Leistungen</h4>
                        <div className="flex flex-wrap gap-2">
                            {services.map((service, index) => {
                                const IconComponent = getIconForTerm(service.name);
                                return (
                                    <Badge key={service.id || index} variant="secondary" className="text-sm bg-gray-100 text-gray-700 font-normal px-2.5 py-1 inline-flex items-center">
                                        {IconComponent && <IconComponent className="w-3.5 h-3.5 mr-1.5 opacity-70" />}
                                        {service.name}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Hint Box - less prominent */}
                <div className="p-3 text-xs rounded-md bg-gray-50 text-gray-500">
                    <p className="font-medium">Hinweis:</p>
                    <p className="mt-1">
                        Leistungsdaten basieren auf öffentlichen Informationen & Patientenberichten. Details bitte direkt bei der Praxis erfragen.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
