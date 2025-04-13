'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
// Adjust import paths relative to the new location
import { apiService } from '../../services/api';
import { PraxisSummary, Service } from '../../types';
// Add imports for Shadcn components
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from 'lucide-react';
// Import Filter Sidebar & Select
import FilterSidebar from '../filters/FilterSidebar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Clock, Heart, MessageCircle, Award, Home, Star, List, Map } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
// Import MapView
import MapView from '../map/MapView';
// Import Skeleton
import { Skeleton } from "@/components/ui/skeleton";

// Define Sort Options (copied from StadtPage)
type SortOption = 'score' | 'name';
// Define View Mode type
type ViewMode = 'list' | 'map';
// Define Kasse/Privat Filter type
type PatientTypeFilter = 'alle' | 'kasse' | 'privat';

// Helper function (copied from StadtPage)
// function getAspectIconClass(positive: number | null | undefined, negative: number | null | undefined): string {
//     // ... (old logic) ...
// }

// Helper for aspect status (new)
function getAspectIconClassFromStatus(status: 'positive' | 'neutral' | 'negative' | 'unknown'): string {
    switch (status) {
        case 'positive': return "text-green-600";
        case 'negative': return "text-red-600";
        default: return "text-gray-400"; // neutral or unknown
    }
}

// Renamed function to SearchContent
export default function SearchContent() {
    const searchParamsHook = useSearchParams();
    const searchQuery = searchParamsHook.get('q');

    // State for data, loading, error
    const [loadingPraxen, setLoadingPraxen] = useState(true);
    const [loadingServices, setLoadingServices] = useState(true);
    const [results, setResults] = useState<PraxisSummary[]>([]);
    const [meta, setMeta] = useState<any>({});
    const [error, setError] = useState<string | null>(null);

    // State for filters & sorting
    const [availableServices, setAvailableServices] = useState<Service[]>([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
    const [minScore, setMinScore] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('score');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    // Add state for Kasse/Privat filter
    const [patientType, setPatientType] = useState<PatientTypeFilter>('alle');

    // Fetch available services (similar to StadtPage)
    useEffect(() => {
        const fetchServices = async () => {
            setLoadingServices(true);
            try {
                const services = await apiService.getServices();
                setAvailableServices(services);
            } catch (err) { console.error('Error fetching services:', err); }
            finally { setLoadingServices(false); }
        };
        fetchServices();
    }, []);

    // Fetch results based on query, filters, sorting, pagination
    const fetchResults = useCallback(async () => {
        if (!searchQuery) {
            setResults([]);
            setMeta({});
            setError(null);
            setLoadingPraxen(false);
            return;
        }
        setLoadingPraxen(true);
        setError(null);
        try {
            const apiParams: any = {
                query: searchQuery,
                sortBy: sortBy,
                sortDirection: sortDirection,
                page: currentPage,
                pageSize: 10
            };
            if (selectedServiceIds.length > 0) apiParams.services = selectedServiceIds;
            if (minScore !== null) apiParams.minScore = minScore;
            // Add patientType filter
            if (patientType !== 'alle') {
                apiParams.patientType = patientType;
            }

            // console.log("Fetching search results with params:", apiParams);

            const result = await apiService.searchPraxen(apiParams);
            setResults(result.data);
            setMeta(result.meta);
        } catch (err: any) {
            // Check for rate limit error (429)
            if (err?.status === 429) {
                console.warn('Rate limit hit fetching search results:', err.message);
                setError('Zu viele Anfragen. Bitte versuchen Sie es später erneut.');
            } else {
                console.error('Error searching praxen:', err);
                setError('Bei der Suche ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
            }
        } finally {
            setLoadingPraxen(false);
        }
    }, [searchQuery, selectedServiceIds, minScore, sortBy, sortDirection, currentPage, patientType]);

    // Trigger fetchResults initially and when dependencies change
    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    // Filter Handlers (reset page)
    const handleServiceFilterChange = useCallback((newSelectedIds: number[]) => {
        setSelectedServiceIds(newSelectedIds);
        setCurrentPage(1);
    }, []);
    const handleScoreFilterChange = useCallback((newMinScore: number | null) => {
        setMinScore(newMinScore);
        setCurrentPage(1);
    }, []);
    // Add handler for Kasse/Privat filter change
    const handlePatientTypeChange = useCallback((newType: PatientTypeFilter) => {
        setPatientType(newType);
        setCurrentPage(1);
    }, []);

    // Sort Handler (reset page)
    const handleSortChange = (value: string) => {
        const [newSortBy, newSortDirection] = value.split('-') as [SortOption, 'asc' | 'desc'];
        setSortBy(newSortBy);
        setSortDirection(newSortDirection);
        setCurrentPage(1);
    };

    // Pagination Handler
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Combined loading state
    const isLoading = loadingPraxen || loadingServices;

    // Handle initial state or missing search query
    if (!searchQuery) {
        return (
            <div className="p-8 text-center">
                <p className="text-lg text-muted-foreground">Bitte geben Sie einen Suchbegriff über die Hauptnavigation oder die Startseite ein.</p>
            </div>
        );
    }

    // Log length before conditional rendering
    if (viewMode === 'list') {
        // console.log("SearchContent: Rendering List View - Results Length:", results.length);
    }

    // Loading Skeleton
    if (isLoading) {
        return (
            <TooltipProvider>
                <div className="container grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
                    <aside className="md:col-span-1">
                        <Skeleton className="h-[500px] w-full rounded-lg" />
                    </aside>
                    <div className="md:col-span-3">
                        <div className="flex justify-between mb-10">
                            <Skeleton className="h-10 w-1/2 rounded" />
                            <Skeleton className="h-10 w-[220px] rounded" />
                        </div>
                        <div className="space-y-6">
                            {[1, 2, 3, 4, 5].map(i =>
                                <Card key={i}>
                                    <CardHeader><Skeleton className="h-6 w-3/4 rounded" /></CardHeader>
                                    <CardContent className="space-y-3">
                                        <Skeleton className="h-4 w-full rounded" />
                                        <Skeleton className="h-4 w-5/6 rounded" />
                                        <div className="flex gap-2 pt-2">
                                            <Skeleton className="h-5 w-20 rounded-full" />
                                            <Skeleton className="h-5 w-24 rounded-full" />
                                        </div>
                                        <div className="flex gap-2 pt-2 border-t mt-3">
                                            <Skeleton className="h-5 w-5 rounded-full" />
                                            <Skeleton className="h-5 w-5 rounded-full" />
                                            <Skeleton className="h-5 w-5 rounded-full" />
                                            <Skeleton className="h-5 w-5 rounded-full" />
                                            <Skeleton className="h-5 w-5 rounded-full" />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end">
                                        <Skeleton className="h-8 w-28 rounded" />
                                    </CardFooter>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        );
    }

    // Error Display (remains similar)
    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 border border-red-200 rounded-lg">
                <h2 className="mb-3 text-xl font-semibold text-red-700">Fehler bei der Suche</h2>
                <p className="mb-6 text-red-600">{error}</p>
                {/* Use Button within Link */}
                <Link href="/">
                    <Button variant="destructive">
                        Zurück zur Startseite
                    </Button>
                </Link>
            </div>
        );
    }

    // Main results display with Grid Layout
    return (
        <TooltipProvider>
            <div className={`container grid grid-cols-1 ${viewMode === 'list' ? 'md:grid-cols-4' : ''} gap-8`}>
                {/* Sidebar Area (only in list view) */}
                {viewMode === 'list' && (
                    <aside className="md:col-span-1">
                        <FilterSidebar
                            availableServices={availableServices}
                            selectedServiceIds={selectedServiceIds}
                            onServiceFilterChange={handleServiceFilterChange}
                            minScore={minScore}
                            onScoreFilterChange={handleScoreFilterChange}
                            // Pass patientType props
                            patientType={patientType}
                            onPatientTypeChange={handlePatientTypeChange}
                        />
                    </aside>
                )}

                {/* Results Area (adjust span based on viewMode) */}
                <div className={`${viewMode === 'list' ? 'md:col-span-3' : 'col-span-1'}`}>
                    {/* Header Area */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 md:mb-10">
                        {/* Title and Count */}
                        <div>
                            <h1 className="mb-1 text-3xl font-bold md:text-4xl">
                                Suchergebnisse für "{searchQuery}"
                            </h1>
                            <p className="text-muted-foreground">
                                {meta.totalItems !== undefined ? `${meta.totalItems}` : results.length} {meta.totalItems === 1 ? 'Praxis' : 'Praxen'} gefunden
                            </p>
                        </div>
                        {/* Sort & View Toggle */}
                        <div className="flex items-center gap-4 pt-1">
                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Sortieren:</span>
                                <Select value={`${sortBy}-${sortDirection}`} onValueChange={handleSortChange}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Sortieren nach..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="score-desc">Beste Bewertung</SelectItem>
                                        <SelectItem value="score-asc">Schlechteste Bewertung</SelectItem>
                                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* View Toggle Buttons */}
                            <div className="flex items-center rounded-md border p-1">
                                <Button
                                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="px-2"
                                    onClick={() => setViewMode('list')}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'map' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="px-2"
                                    onClick={() => setViewMode('map')}
                                >
                                    <Map className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Conditional Content: List or Map */}
                    {viewMode === 'list' ? (
                        <>
                            {results.length > 0 ? (
                                <div className="space-y-6 md:space-y-8">
                                    {results.map((praxis) => {
                                        // console.log("SearchContent: Rendering Card for:", praxis.name, praxis);
                                        // Use new top-level fields
                                        const score = praxis.overall_score;
                                        const hasScore = score !== null && score !== undefined;
                                        const aspectStatus = praxis.analysis_aspects_status; // Get status object

                                        // Restore Link, Card, Header, Footer
                                        return (
                                            // Use google_place_id for key
                                            <Link key={praxis.google_place_id} href={`/hautarzt/${praxis.city_slug}/${praxis.slug}`} className="block group" >
                                                <Card className="transition-shadow duration-300 hover:shadow-lg">
                                                    <CardHeader>
                                                        <div className="flex justify-between items-start">
                                                            <CardTitle>{praxis.name}</CardTitle>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        {/* Address, Phone - Use new field names & handle missing address */}
                                                        <p className="mb-1 text-gray-600 md:text-base">
                                                            {praxis.address}{praxis.address && praxis.postal_code ? ', ' : ''}{praxis.postal_code}
                                                        </p>
                                                        {praxis.located_in && (
                                                            <p className="mb-1 text-xs text-muted-foreground">({praxis.located_in})</p>
                                                        )}
                                                        {praxis.telefon && (
                                                            <p className="mb-3 text-gray-600 md:text-base">{praxis.telefon}</p>
                                                        )}
                                                        {/* Hint for temporarily closed */}
                                                        {praxis.business_status === 'CLOSED_TEMPORARILY' && (
                                                            <p className="mb-3 text-sm font-medium text-orange-600">Vorübergehend geschlossen</p>
                                                        )}
                                                        {/* Score / Reviews Badges */}
                                                        <div className="mt-4 flex flex-wrap gap-2 items-center">
                                                            {hasScore && (
                                                                // Use updated style from previous step
                                                                <div className="inline-flex items-center px-3.5 py-1.5 text-sm font-medium rounded-full text-blue-900 bg-blue-200">
                                                                    <Star className="h-4 w-4 mr-1.5 text-yellow-500" />
                                                                    {/* Use top-level score */}
                                                                    Score: <span className="font-bold ml-1">{score.toFixed(1)}</span>
                                                                </div>
                                                            )}
                                                            {/* Assuming bewertung_count is still available */}
                                                            {praxis.bewertung_count !== undefined && praxis.bewertung_count > 0 && (
                                                                <div className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full text-gray-700 bg-gray-100">
                                                                    <MessageCircle className="h-4 w-4 mr-1.5" />
                                                                    {praxis.bewertung_count} Bewertungen
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Aspect Icons with Tooltips - Use new status object */}
                                                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center space-x-3">
                                                            <span className="text-xs text-muted-foreground">Einblicke:</span>
                                                            {aspectStatus ? (
                                                                <>
                                                                    <Tooltip><TooltipTrigger asChild><Clock className={`w-5 h-5 ${getAspectIconClassFromStatus(aspectStatus.termin_wartezeit)}`} /></TooltipTrigger><TooltipContent><p>Termin/Wartezeit</p></TooltipContent></Tooltip>
                                                                    <Tooltip><TooltipTrigger asChild><Heart className={`w-5 h-5 ${getAspectIconClassFromStatus(aspectStatus.freundlichkeit_empathie)}`} /></TooltipTrigger><TooltipContent><p>Freundlichkeit</p></TooltipContent></Tooltip>
                                                                    <Tooltip><TooltipTrigger asChild><MessageCircle className={`w-5 h-5 ${getAspectIconClassFromStatus(aspectStatus.aufklaerung_vertrauen)}`} /></TooltipTrigger><TooltipContent><p>Aufklärung/Vertrauen</p></TooltipContent></Tooltip>
                                                                    <Tooltip><TooltipTrigger asChild><Award className={`w-5 h-5 ${getAspectIconClassFromStatus(aspectStatus.kompetenz_behandlung)}`} /></TooltipTrigger><TooltipContent><p>Kompetenz</p></TooltipContent></Tooltip>
                                                                    <Tooltip><TooltipTrigger asChild><Home className={`w-5 h-5 ${getAspectIconClassFromStatus(aspectStatus.praxis_ausstattung)}`} /></TooltipTrigger><TooltipContent><p>Praxis/Ausstattung</p></TooltipContent></Tooltip>
                                                                </>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground italic">Keine Detail-Einblicke verfügbar</span>
                                                            )}
                                                        </div>
                                                        {/* Summary Snippet - Use new field */}
                                                        {praxis.analysis_summary_snippet && (
                                                            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                                                                {praxis.analysis_summary_snippet}
                                                            </p>
                                                        )}
                                                        {/* Tags - Use new field */}
                                                        {praxis.analysis_tags && praxis.analysis_tags.length > 0 && (
                                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                                {praxis.analysis_tags.map((tag) => (
                                                                    <Badge key={tag} variant="outline" className="text-xs font-normal">{tag}</Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                    <CardFooter className="flex justify-end">
                                                        {/* Use updated button style from previous step */}
                                                        <Button variant="outline" size="sm" className="group text-blue-700 border-blue-600 hover:bg-blue-50">
                                                            Details ansehen<ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 text-center border border-gray-200 bg-gray-50 rounded-lg">
                                    <h2 className="mb-3 text-xl font-semibold text-gray-700">Keine Ergebnisse</h2>
                                    <p className="mb-4 text-gray-600">Keine Hautärzte für "{searchQuery}" gefunden.</p>
                                    <Link href="/"><Button>Zurück zur Startseite</Button></Link>
                                </div>
                            )}
                            {/* Pagination Controls (only for list view) */}
                            {meta.totalPages > 1 && (
                                <div className="mt-8 flex justify-center items-center space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>Zurück</Button>
                                    <span className="text-sm text-muted-foreground">Seite {currentPage} von {meta.totalPages}</span>
                                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= meta.totalPages}>Weiter</Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-[70vh] w-full bg-muted rounded-md border overflow-hidden">
                            {/* Render actual MapView */}
                            <MapView praxen={results} />
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
} 