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
// Import the constants
import { CORE_DERMATOLOGY_IDENTIFIERS, HIGHLIGHT_SERVICE_KEYWORDS, MAX_HIGHLIGHT_SNIPPETS } from '@/lib/constants';
import Image from 'next/image'; // Import Next Image
import { CheckCircle, MapPin } from 'lucide-react'; // Icons for badge/snippet

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
    // if (viewMode === 'list') {
    //     // console.log("SearchContent: Rendering List View - Results Length:", results.length);
    // }

    // Loading Skeleton - TEMPORARILY REMOVED FOR DEBUGGING
    /*
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
    */

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
                                    {results.map((praxis, index) => {
                                        const score = praxis.overall_score;
                                        const hasScore = score !== null && score !== undefined;
                                        const aspectStatus = praxis.analysis_aspects_status;

                                        // --- NEW LOGIC --- 
                                        // Check if it's a core dermatology practice
                                        const isCoreDermatology = praxis.category === 'Hautarzt' ||
                                            (praxis.subtypes && praxis.subtypes.some(sub => CORE_DERMATOLOGY_IDENTIFIERS.has(sub)));

                                        // Find highlight snippets
                                        const highlights: string[] = [];
                                        const combinedSources = [
                                            ...(praxis.subtypes || []),
                                            ...(praxis.analysis_tags || [])
                                        ];
                                        const addedHighlights = new Set<string>(); // Avoid duplicate keywords

                                        for (const sourceItem of combinedSources) {
                                            if (highlights.length >= MAX_HIGHLIGHT_SNIPPETS) break;
                                            const lowerSourceItem = sourceItem.toLowerCase();
                                            for (const keyword of HIGHLIGHT_SERVICE_KEYWORDS) {
                                                if (lowerSourceItem.includes(keyword) && !addedHighlights.has(keyword)) {
                                                    // Find the original case version if possible, otherwise use keyword
                                                    const originalCase = praxis.subtypes?.find(s => s.toLowerCase().includes(keyword)) ||
                                                        praxis.analysis_tags?.find(t => t.toLowerCase().includes(keyword)) ||
                                                        keyword; // Fallback to keyword itself
                                                    highlights.push(originalCase);
                                                    addedHighlights.add(keyword); // Mark keyword as added
                                                    if (highlights.length >= MAX_HIGHLIGHT_SNIPPETS) break;
                                                }
                                            }
                                        }
                                        // --- END NEW LOGIC ---

                                        return (
                                            <Link key={praxis.google_place_id} href={`/hautarzt/${praxis.city_slug}/${praxis.slug}`} className="block group" >
                                                {/* Card layout: Image on left (md), Content on right */}
                                                <Card className="transition-shadow duration-300 hover:shadow-lg overflow-hidden flex flex-col md:flex-row h-full">
                                                    {/* Photo Section - Smaller Width & Aspect Ratio */}
                                                    {praxis.photo && (
                                                        <div className="relative w-full md:w-1/4 flex-shrink-0 aspect-[4/3]"> {/* Changed aspect, width */}
                                                            <Image
                                                                src={praxis.photo}
                                                                alt={`Foto von ${praxis.name}`}
                                                                fill
                                                                sizes="(max-width: 768px) 100vw, 25vw" // Adjust sizes
                                                                style={{ objectFit: 'cover' }}
                                                                className="transition-transform duration-300 group-hover:scale-105"
                                                                priority={index < 3}
                                                            />
                                                        </div>
                                                    )}
                                                    {/* Content Section - Simplify conditional class */}
                                                    <div className={`p-4 flex flex-col flex-grow ${praxis.photo ? 'md:w-3/4' : 'w-full'}`}>
                                                        {/* Badge / Category FIRST */}
                                                        <div className="mb-1 order-1">
                                                            {isCoreDermatology ? (
                                                                <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2 py-0.5">
                                                                    <CheckCircle className="h-3.5 w-3.5 mr-1" /> Facharzt für Dermatologie
                                                                </Badge>
                                                            ) : (
                                                                praxis.category && <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{praxis.category}</span>
                                                            )}
                                                        </div>
                                                        {/* Title SECOND */}
                                                        <h3 className="text-lg font-semibold text-gray-800 mb-0.5 order-2 group-hover:text-blue-700 line-clamp-1">{praxis.name}</h3>
                                                        {/* Location THIRD (+ Located In) */}
                                                        <div className="mb-2 order-3">
                                                            <p className="text-sm text-gray-500 flex items-center">
                                                                <MapPin className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                                                                {praxis.city || praxis.postal_code}
                                                            </p>
                                                            {praxis.located_in && (
                                                                <p className="ml-[18px] text-xs text-muted-foreground">({praxis.located_in})</p>
                                                            )}
                                                        </div>

                                                        {/* Middle section - Now includes subtypes, services, tags */}
                                                        <div className="order-4 flex-grow mb-2 space-y-1.5">
                                                            {/* Subtypes (Filter out generic ones?) */}
                                                            {praxis.subtypes && praxis.subtypes.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    <span className="text-xs font-medium text-gray-400 mr-1">Fokus:</span>
                                                                    {praxis.subtypes
                                                                        .filter(st => !['Arzt', 'Arztpraxis', 'Service establishment'].includes(st)) // Example filter
                                                                        .slice(0, 3) // Limit count
                                                                        .map(st => (
                                                                            <Badge key={st} variant="outline" className="text-xs font-normal px-1.5 py-0.5 border-blue-200 text-blue-700">{st}</Badge>
                                                                        ))}
                                                                </div>
                                                            )}
                                                            {/* Offered Services (Limit count) */}
                                                            {praxis.offered_service_names && praxis.offered_service_names.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    <span className="text-xs font-medium text-gray-400 mr-1">Leist.:</span>
                                                                    {praxis.offered_service_names.slice(0, 3).map(srv => (
                                                                        <Badge key={srv} variant="outline" className="text-xs font-normal px-1.5 py-0.5 border-gray-300 text-gray-600">{srv}</Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {/* AI Tags (Limit count) */}
                                                            {praxis.analysis_tags && praxis.analysis_tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    <span className="text-xs font-medium text-gray-400 mr-1">Tags:</span>
                                                                    {praxis.analysis_tags.slice(0, 3).map(tag => (
                                                                        <Badge key={tag} variant="outline" className="text-xs font-normal px-1.5 py-0.5 border-purple-200 text-purple-700">{tag}</Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {/* Award Badges (if any) */}
                                                            {praxis.award_badges && praxis.award_badges.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {/* Add specific styling for awards */}
                                                                    {praxis.award_badges.map(award => (
                                                                        <Badge key={award} variant="default" className="text-xs bg-yellow-400 text-yellow-900">{award}</Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {/* RE-ADD Summary Snippet */}
                                                            {praxis.analysis_summary_snippet && (
                                                                <p className="my-1 text-sm text-gray-600 line-clamp-2">
                                                                    {praxis.analysis_summary_snippet}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Footer - Fixed at bottom */}
                                                        <div className="order-5 mt-auto pt-2 border-t border-gray-100">
                                                            {/* Score / Reviews Badges & Aspect Icons Row */}
                                                            <div className="flex flex-wrap gap-x-3 gap-y-1.5 items-center justify-between">
                                                                {/* Left side: Score & Review Count */}
                                                                <div className="flex flex-wrap gap-2 items-center">
                                                                    {hasScore && (
                                                                        <div className="inline-flex items-center text-sm font-medium text-gray-700">
                                                                            <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                                                                            <span className="font-bold mr-1">{score.toFixed(1)}</span>
                                                                            {(praxis.bewertung_count && praxis.bewertung_count > 0) && (
                                                                                <span className="ml-1 text-gray-500 text-xs">({praxis.bewertung_count} Reviews)</span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* Right side: Aspect Icons */}
                                                                <div className="flex items-center space-x-1.5">
                                                                    {aspectStatus ? (
                                                                        <>
                                                                            <Tooltip><TooltipTrigger asChild><Clock className={`w-4 h-4 ${getAspectIconClassFromStatus(aspectStatus.termin_wartezeit)}`} /></TooltipTrigger><TooltipContent><p>Termin/Wartezeit</p></TooltipContent></Tooltip>
                                                                            <Tooltip><TooltipTrigger asChild><Heart className={`w-4 h-4 ${getAspectIconClassFromStatus(aspectStatus.freundlichkeit_empathie)}`} /></TooltipTrigger><TooltipContent><p>Freundlichkeit</p></TooltipContent></Tooltip>
                                                                            <Tooltip><TooltipTrigger asChild><MessageCircle className={`w-4 h-4 ${getAspectIconClassFromStatus(aspectStatus.aufklaerung_vertrauen)}`} /></TooltipTrigger><TooltipContent><p>Aufklärung/Vertrauen</p></TooltipContent></Tooltip>
                                                                            <Tooltip><TooltipTrigger asChild><Award className={`w-4 h-4 ${getAspectIconClassFromStatus(aspectStatus.kompetenz_behandlung)}`} /></TooltipTrigger><TooltipContent><p>Kompetenz</p></TooltipContent></Tooltip>
                                                                            <Tooltip><TooltipTrigger asChild><Home className={`w-4 h-4 ${getAspectIconClassFromStatus(aspectStatus.praxis_ausstattung)}`} /></TooltipTrigger><TooltipContent><p>Praxis/Ausstattung</p></TooltipContent></Tooltip>
                                                                        </>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
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