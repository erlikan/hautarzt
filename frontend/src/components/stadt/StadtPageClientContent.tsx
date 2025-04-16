'use client';

// All imports needed for the client-side logic and rendering
import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation'; // Import useSearchParams for nearby
import { apiService } from '../../services/api';
import { PraxisSummary, Service } from '../../types';
import { SearchPraxenParams } from '../../services/api';
import {
    Card, CardContent, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Heart, MessageCircle, Award, Home, Star, List, Map, ArrowRight, ChevronRight } from 'lucide-react';
import FilterSidebar from '../filters/FilterSidebar';
import MapView from '../map/MapView';
import { CORE_DERMATOLOGY_IDENTIFIERS, HIGHLIGHT_SERVICE_KEYWORDS, MAX_HIGHLIGHT_SNIPPETS } from '@/lib/constants';
import Image from 'next/image'; // Import Next Image
import { CheckCircle, MapPin } from 'lucide-react'; // Icons for badge/snippet

// --- Types and Helper Functions (Can be moved to utils) ---
type SortOption = 'score' | 'name';
type ViewMode = 'list' | 'map';
type PatientTypeFilter = 'alle' | 'kasse' | 'privat';

function capitalizeCity(slug: string): string {
    if (!slug) return '';
    // Handle special "nearby" case
    if (slug === 'nearby') return 'In Ihrer Nähe';
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getAspectIconClass(positive: number | null | undefined, negative: number | null | undefined): string {
    const p = positive || 0;
    const n = negative || 0;
    if (p > 60 && p > n * 1.5) return "text-green-600";
    if (n > 40 && n > p * 1.5) return "text-red-600";
    return "text-gray-400";
}

// Helper for aspect status (new)
function getAspectIconClassFromStatus(status: 'positive' | 'neutral' | 'negative' | 'unknown'): string {
    switch (status) {
        case 'positive': return "text-green-600";
        case 'negative': return "text-red-600";
        default: return "text-gray-400"; // neutral or unknown
    }
}

// ----------------------------------------------------------

export default function StadtPageClientContent() {
    // Hooks to get route/query params
    const params = useParams();
    const queryParams = useSearchParams(); // For lat/lon AND plz filter
    const stadtSlug = params.stadtSlug as string;
    const latParam = queryParams.get('lat');
    const lonParam = queryParams.get('lon');
    const plzFilter = queryParams.get('plz'); // Get plz filter from URL

    // State for data, loading, error
    const [loadingPraxen, setLoadingPraxen] = useState(true);
    const [loadingServices, setLoadingServices] = useState(true);
    const [praxen, setPraxen] = useState<PraxisSummary[]>([]);
    const [meta, setMeta] = useState<any>({});
    const [error, setError] = useState<string | null>(null);

    // State for filters, sorting, pagination, view mode
    const [availableServices, setAvailableServices] = useState<Service[]>([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
    const [minScore, setMinScore] = useState<number | null>(null);
    const [patientType, setPatientType] = useState<PatientTypeFilter>('alle');
    const [sortBy, setSortBy] = useState<SortOption>('score');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [viewMode, setViewMode] = useState<ViewMode>('list');

    const stadtName = useMemo(() => stadtSlug ? capitalizeCity(stadtSlug) : '', [stadtSlug]);

    // Fetch available services
    useEffect(() => {
        // ... fetchServices logic ...
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

    // Fetch praxen based on city OR lat/lon + filters/sort/page
    const fetchPraxen = useCallback(async () => {
        setLoadingPraxen(true);
        setError(null);
        try {
            const lat = latParam ? parseFloat(latParam) : undefined;
            const lon = lonParam ? parseFloat(lonParam) : undefined;

            // Construct search params using new interface
            const searchApiParams: SearchPraxenParams = {
                sortBy: sortBy,
                sortDirection: sortDirection,
                page: currentPage,
                pageSize: 10,
                contextCitySlug: stadtSlug === 'nearby' ? undefined : stadtSlug, // Pass city slug for context
                geoLat: lat, // Pass geo coords if available (nearby)
                geoLon: lon,
                filterPostalCode: plzFilter || undefined, // Pass postal code filter if present
            };

            // Handle nearby logic (needs lat/lon)
            if (stadtSlug === 'nearby') {
                if (lat === undefined || lon === undefined) {
                    setError('Standortparameter (lat/lon) fehlen für Umkreissuche.');
                    setLoadingPraxen(false);
                    return;
                }
                // Add radius for nearby search
                searchApiParams.geoRadiusMeters = 20000; // Example radius
                // Ensure contextCitySlug is undefined for nearby
                searchApiParams.contextCitySlug = undefined;
            } else if (!stadtSlug) {
                setError('Ungültiger Stadt-Slug.'); // Should not happen if routing is correct
                setLoadingPraxen(false);
                return;
            }

            // Add other filters
            if (selectedServiceIds.length > 0) searchApiParams.filterServiceIds = selectedServiceIds;
            if (minScore !== null) searchApiParams.filterMinScore = minScore;
            // Note: patientType filter not currently supported by backend SP
            // if (patientType !== 'alle') searchApiParams.filterPatientType = patientType;

            // console.log("Fetching praxen with new params:", searchApiParams);
            const result = await apiService.searchPraxen(searchApiParams);
            setPraxen(result.data);
            setMeta(result.meta);
        } catch (err: any) {
            // Check for rate limit error (429)
            if (err?.status === 429) {
                console.warn('Rate limit hit fetching praxen:', err.message);
                setError('Zu viele Anfragen. Bitte versuchen Sie es später erneut.');
            } else {
                console.error('Error fetching praxen:', err);
                setError(err.message || 'Die Daten konnten nicht geladen werden.');
            }
        } finally {
            setLoadingPraxen(false);
        }
    }, [stadtSlug, stadtName, latParam, lonParam, selectedServiceIds, minScore, patientType, sortBy, sortDirection, currentPage, plzFilter]);

    // Initial fetch and re-fetch on dependency change
    useEffect(() => {
        fetchPraxen();
    }, [fetchPraxen]);

    // Filter/Sort/Page change handlers (reset page, call fetch)
    const handleServiceFilterChange = useCallback((ids: number[]) => { setSelectedServiceIds(ids); setCurrentPage(1); }, []);
    const handleScoreFilterChange = useCallback((score: number | null) => { setMinScore(score); setCurrentPage(1); }, []);
    const handlePatientTypeChange = useCallback((type: PatientTypeFilter) => { setPatientType(type); setCurrentPage(1); }, []);
    const handleSortChange = useCallback((value: string) => {
        const [newSortBy, newSortDirection] = value.split('-') as [SortOption, 'asc' | 'desc'];
        setSortBy(newSortBy);
        setSortDirection(newSortDirection);
        setCurrentPage(1);
    }, []);
    const handlePageChange = useCallback((newPage: number) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const isLoading = loadingPraxen || loadingServices;

    // --- RENDER LOGIC --- 

    // Log length before conditional rendering
    if (viewMode === 'list') {
        // console.log("Rendering List View - Praxen Length:", praxen.length);
    }

    if (isLoading) {
        // Return Skeleton Loader JSX...
        return (
            <TooltipProvider> {/* ... skeleton JSX from StadtPage ... */} </TooltipProvider>
        ); // Ensure closing parenthesis for the return statement
    }

    // ADDED: Error Display Block
    if (error) {
        // Render an error message based on the error state
        return (
            <div className="p-8 text-center bg-red-50 border border-red-200 rounded-lg">
                <h2 className="mb-3 text-xl font-semibold text-red-700">Fehler</h2>
                <p className="mb-6 text-red-600">{error}</p>
                <Link href="/">
                    <Button variant="destructive">
                        Zurück zur Startseite
                    </Button>
                </Link>
            </div>
        );
    }

    // Main Return with Grid, Sidebar, Results/Map, Pagination
    return (
        <TooltipProvider>
            {/* Breadcrumbs */}
            <nav className="mb-6 text-sm text-muted-foreground flex items-center space-x-1">
                <Link href="/" className="hover:text-primary">Startseite</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-foreground">{`Hautärzte in ${stadtName}`}</span>
            </nav>

            {/* Conditionally show PLZ filter info */}
            {plzFilter && (
                <p className="text-sm text-muted-foreground mb-6">
                    Filter aktiv: Zeige nur Ergebnisse für PLZ {plzFilter} in {stadtName}.
                </p>
            )}

            <div className={`container grid grid-cols-1 ${viewMode === 'list' ? 'md:grid-cols-4' : ''} gap-8 px-0`}> {/* Removed container padding here */}
                {viewMode === 'list' && (
                    <aside className="md:col-span-1">
                        <FilterSidebar
                            availableServices={availableServices}
                            selectedServiceIds={selectedServiceIds}
                            onServiceFilterChange={handleServiceFilterChange}
                            minScore={minScore}
                            onScoreFilterChange={handleScoreFilterChange}
                            patientType={patientType}
                            onPatientTypeChange={handlePatientTypeChange}
                        />
                    </aside>
                )}
                <div className={`${viewMode === 'list' ? 'md:col-span-3' : 'col-span-1'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 md:mb-10">
                        {/* ... Header: Title, Count ... */}
                        <div>
                            <h1 className="mb-1 text-3xl font-bold md:text-4xl">
                                Hautärzte {stadtSlug === 'nearby' ? 'in Ihrer Nähe' : `in ${stadtName}`}
                            </h1>
                            <p className="text-muted-foreground">
                                {meta.totalItems !== undefined ? `${meta.totalItems}` : praxen.length} {meta.totalItems === 1 ? 'Praxis' : 'Praxen'} gefunden
                            </p>
                        </div>
                        {/* ... Header: Sort, View Toggle ... */}
                        <div className="flex items-center gap-4 pt-1">
                            {/* ... Sort Select ... */}
                            <div className="flex items-center rounded-md border p-1 bg-muted">
                                <Button
                                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                    className="px-3"
                                    aria-label="Listenansicht"
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'map' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('map')}
                                    className="px-3"
                                    aria-label="Kartenansicht"
                                >
                                    <Map className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    {viewMode === 'list' ? (
                        <>
                            {praxen.length > 0 ? (
                                <div className="space-y-6 md:space-y-8">
                                    {praxen.map((praxis, index) => {
                                        const score = praxis.overall_score;
                                        const hasScore = score !== null && score !== undefined;
                                        const aspectStatus = praxis.analysis_aspects_status;

                                        // --- NEW LOGIC (Copied from SearchContent) --- 
                                        const isCoreDermatology = praxis.category === 'Hautarzt' ||
                                            (praxis.subtypes && praxis.subtypes.some(sub => CORE_DERMATOLOGY_IDENTIFIERS.has(sub)));

                                        const highlights: string[] = [];
                                        const combinedSources = [
                                            ...(praxis.subtypes || []),
                                            ...(praxis.analysis_tags || [])
                                        ];
                                        const addedHighlights = new Set<string>();

                                        for (const sourceItem of combinedSources) {
                                            if (highlights.length >= MAX_HIGHLIGHT_SNIPPETS) break;
                                            const lowerSourceItem = sourceItem.toLowerCase();
                                            for (const keyword of HIGHLIGHT_SERVICE_KEYWORDS) {
                                                if (lowerSourceItem.includes(keyword) && !addedHighlights.has(keyword)) {
                                                    const originalCase = praxis.subtypes?.find(s => s.toLowerCase().includes(keyword)) ||
                                                        praxis.analysis_tags?.find(t => t.toLowerCase().includes(keyword)) ||
                                                        keyword;
                                                    highlights.push(originalCase);
                                                    addedHighlights.add(keyword);
                                                    if (highlights.length >= MAX_HIGHLIGHT_SNIPPETS) break;
                                                }
                                            }
                                        }
                                        // --- END NEW LOGIC ---

                                        return (
                                            // Entire card is a link
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
                                                    {/* Content Section - Takes remaining width */}
                                                    <div className={`p-4 flex flex-col flex-grow ${praxis.photo ? 'md:w-3/4' : 'w-full'}`}> {/* Changed padding, width */}
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
                                                                        <div className="inline-flex items-center text-sm font-medium text-gray-700"> {/* Slightly larger text */}
                                                                            <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                                                                            <span className="font-bold mr-1">{score.toFixed(1)}</span>
                                                                            {(praxis.bewertung_count && praxis.bewertung_count > 0) && (
                                                                                <span className="text-gray-500 text-xs">({praxis.bewertung_count} Reviews)</span>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                </div>
                                                                {/* Right side: Aspect Icons */}
                                                                <div className="flex items-center space-x-1.5">
                                                                    {aspectStatus ? (
                                                                        <>
                                                                            {/* Tooltips go here */}
                                                                            <Tooltip><TooltipTrigger asChild><Clock className={`w-4 h-4 ${getAspectIconClassFromStatus(aspectStatus.termin_wartezeit)}`} /></TooltipTrigger><TooltipContent><p>Termin/Wartezeit</p></TooltipContent></Tooltip>
                                                                            <Tooltip><TooltipTrigger asChild><Heart className={`w-4 h-4 ${getAspectIconClassFromStatus(aspectStatus.freundlichkeit_empathie)}`} /></TooltipTrigger><TooltipContent><p>Freundlichkeit</p></TooltipContent></Tooltip>
                                                                            <Tooltip><TooltipTrigger asChild><MessageCircle className={`w-4 h-4 ${getAspectIconClassFromStatus(aspectStatus.aufklaerung_vertrauen)}`} /></TooltipTrigger><TooltipContent><p>Aufklärung/Vertrauen</p></TooltipContent></Tooltip>
                                                                            <Tooltip><TooltipTrigger asChild><Award className={`w-4 h-4 ${getAspectIconClassFromStatus(aspectStatus.kompetenz_behandlung)}`} /></TooltipTrigger><TooltipContent><p>Kompetenz</p></TooltipContent></Tooltip>
                                                                            <Tooltip><TooltipTrigger asChild><Home className={`w-4 h-4 ${getAspectIconClassFromStatus(aspectStatus.praxis_ausstattung)}`} /></TooltipTrigger><TooltipContent><p>Praxis/Ausstattung</p></TooltipContent></Tooltip>
                                                                        </>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </div> {/* End Footer */}
                                                    </div> {/* End Content Section */}
                                                </Card>
                                            </Link>
                                        ); // End return for map item
                                    })} {/* End map function call */}
                                </div> // End results div
                            ) : (
                                <div className="p-10 text-center bg-gray-50 border rounded-lg">
                                    <h2 className="mb-3 text-xl font-semibold">Keine Ergebnisse</h2>
                                    <p className="mb-6 text-muted-foreground">Für Ihre Suche konnten keine Praxen gefunden werden.</p>
                                </div>
                            )}
                            {/* Pagination Controls (Re-add) */}
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
                            <MapView praxen={praxen} />
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
} 