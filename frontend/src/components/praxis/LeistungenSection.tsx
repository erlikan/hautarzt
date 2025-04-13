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
import { FlaskConical } from 'lucide-react';

// Define a simple interface for the service object expected
interface ServiceObject {
    name: string;
    // Allow other properties if they exist (e.g., id)
    [key: string]: any;
}

interface LeistungenSectionProps {
    // Expect an array of ServiceObject or null
    services: ServiceObject[] | null;
}

export default function LeistungenSection({ services }: LeistungenSectionProps) {
    if (!services || services.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Leistungen & Spezialisierungen</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Keine spezifischen Leistungsdaten verfügbar.</p>
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
                <div className="flex flex-wrap gap-2 mb-6">
                    {services.map((service, index) => (
                        <Badge key={service.id || index} variant="secondary">
                            {service.name}
                        </Badge>
                    ))}
                </div>

                <div className="p-4 text-sm rounded-md bg-muted text-muted-foreground">
                    <p className="font-semibold">Hinweis:</p>
                    <p className="mt-1">
                        Die hier aufgeführten Leistungen basieren auf öffentlich zugänglichen Informationen
                        und Patientenberichten. Bitte kontaktieren Sie die Praxis direkt für detaillierte Informationen.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
