'use client';

import { useState, useEffect } from 'react';
import { Service } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Filter, X } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Define type here as well
type PatientTypeFilter = 'alle' | 'kasse' | 'privat';

interface FilterSidebarProps {
    availableServices: Service[];
    selectedServiceIds: number[];
    onServiceFilterChange: (selectedIds: number[]) => void;
    // Add props for score filter
    minScore: number | null;
    onScoreFilterChange: (minScore: number | null) => void;
    // Add props for Kasse/Privat filter
    patientType: PatientTypeFilter;
    onPatientTypeChange: (type: PatientTypeFilter) => void;
}

export default function FilterSidebar({
    availableServices,
    selectedServiceIds,
    onServiceFilterChange,
    // Destructure score props
    minScore,
    onScoreFilterChange,
    // Destructure patientType props
    patientType,
    onPatientTypeChange,
}: FilterSidebarProps) {

    const handleServiceChange = (serviceId: number, checked: boolean | 'indeterminate') => {
        let newSelectedIds: number[];
        if (checked) {
            newSelectedIds = [...selectedServiceIds, serviceId];
        } else {
            newSelectedIds = selectedServiceIds.filter(id => id !== serviceId);
        }
        onServiceFilterChange(newSelectedIds);
    };

    const clearServiceFilters = () => {
        onServiceFilterChange([]);
    };

    // Handler for slider change (commits on release)
    const handleScoreChange = (value: number[]) => {
        const newMinScore = value[0];
        // Treat 0 as null (no filter)
        onScoreFilterChange(newMinScore > 0 ? newMinScore : null);
    };

    const clearScoreFilter = () => {
        onScoreFilterChange(null);
    };

    // Local state to display slider value while dragging
    const [displayScore, setDisplayScore] = useState<number>(minScore || 0);

    // Update displayScore when prop changes
    useEffect(() => {
        setDisplayScore(minScore || 0);
    }, [minScore]);

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between border-b pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filter
                </CardTitle>
                {/* Optional: Add a button to clear all filters */}
            </CardHeader>
            <CardContent className="p-4">
                <Accordion type="multiple" className="w-full" defaultValue={['item-score', 'item-patiententyp']}>
                    <AccordionItem value="item-leistungen">
                        <AccordionTrigger className="text-base font-semibold hover:no-underline">
                            Leistungen
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-3">
                            {availableServices.length > 0 ? (
                                <>
                                    {availableServices.map((service) => (
                                        <div key={service.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`service-${service.id}`}
                                                checked={selectedServiceIds.includes(service.id)}
                                                onCheckedChange={(checked) => handleServiceChange(service.id, checked)}
                                            />
                                            <Label
                                                htmlFor={`service-${service.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {service.name}
                                            </Label>
                                        </div>
                                    ))}
                                    {selectedServiceIds.length > 0 && (
                                        <Button variant="ghost" size="sm" onClick={clearServiceFilters} className="mt-2 text-xs text-muted-foreground">
                                            <X className="w-3 h-3 mr-1" />
                                            Leistungsfilter zurücksetzen
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">Keine Leistungsfilter verfügbar.</p>
                            )}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-score">
                        <AccordionTrigger className="text-base font-semibold hover:no-underline">
                            Mindest-Score
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-3">
                            <div className="flex justify-between items-center mb-2">
                                <Label className="text-sm">Score: {displayScore === 0 ? 'Alle' : `${displayScore}+`}</Label>
                                {minScore !== null && (
                                    <Button variant="ghost" size="sm" onClick={clearScoreFilter} className="text-xs text-muted-foreground">
                                        <X className="w-3 h-3 mr-1" />
                                        Zurücksetzen
                                    </Button>
                                )}
                            </div>
                            <Slider
                                defaultValue={[minScore || 0]}
                                value={[displayScore]} // Control display value
                                max={100}
                                step={5} // Use steps of 5 for score
                                onValueChange={(value) => setDisplayScore(value[0])} // Update display only
                                onValueCommit={handleScoreChange} // Update actual filter on commit
                                className="w-[90%] mx-auto [&>span:first-child]:h-2 [&>span:first-child_>span]:h-2 [&>button]:w-5 [&>button]:h-5"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground px-2">
                                <span>0</span>
                                <span>100</span>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-patiententyp">
                        <AccordionTrigger className="text-base font-semibold hover:no-underline">
                            Patiententyp
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                            <RadioGroup
                                value={patientType}
                                onValueChange={(value) => onPatientTypeChange(value as PatientTypeFilter)}
                                className="space-y-2"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="alle" id="type-alle" />
                                    <Label htmlFor="type-alle" className="text-sm font-medium">Alle</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="kasse" id="type-kasse" />
                                    <Label htmlFor="type-kasse" className="text-sm font-medium">Kassenpatient</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="privat" id="type-privat" />
                                    <Label htmlFor="type-privat" className="text-sm font-medium">Privatpatient</Label>
                                </div>
                            </RadioGroup>
                        </AccordionContent>
                    </AccordionItem>

                </Accordion>
            </CardContent>
        </Card>
    );
} 