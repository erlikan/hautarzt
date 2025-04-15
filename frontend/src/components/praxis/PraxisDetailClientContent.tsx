'use client';

// Move all imports related to client-side logic here
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiService } from '../../services/api';
import { PraxisDetail, PraxisAnalysisData } from '../../types';
import PraxisHeader from './PraxisHeader';
import KiDashboard from './KiDashboard';
import LeistungenSection from './LeistungenSection';
import PraxisInfoSection from './PraxisInfoSection';
import SchemaOrgJsonLd from '../seo/SchemaOrgJsonLd';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, ClipboardList, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import { capitalizeCity } from '@/lib/utils';

// The entire logic from the previous PraxisDetailPage component goes here
export default function PraxisDetailClientContent() {
    const { stadtSlug, praxisSlug } = useParams();
    const [loading, setLoading] = useState(true);
    const [praxis, setPraxis] = useState<PraxisDetail | null>(null);
    const [analysisData, setAnalysisData] = useState<PraxisAnalysisData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPraxisDetail = async () => {
            if (!stadtSlug || !praxisSlug || typeof stadtSlug !== 'string' || typeof praxisSlug !== 'string') {
                setError('Praxis nicht gefunden oder URL ungültig.');
                setLoading(false);
                return;
            }
            setLoading(true); // Ensure loading starts
            setError(null);
            try {
                const praxisData = await apiService.getPraxisDetailBySlug(stadtSlug, praxisSlug);
                if (!praxisData) {
                    setError('Praxis nicht gefunden');
                    setLoading(false);
                    return;
                }
                setPraxis(praxisData);

                // Use analysis data directly embedded in PraxisDetail if available from API
                if (praxisData.analysis) {
                    setAnalysisData(praxisData.analysis);
                }
                // Optional: Fallback to separate fetch if needed - remove if details API includes everything
                /* else if (praxisData.google_place_id) { 
                    console.log('Fetching analysis data separately for:', praxisData.google_place_id);
                    const fetchedAnalysisData = await apiService.getPraxisAnalysisData(praxisData.google_place_id);
                    console.log('Fetched analysis data:', fetchedAnalysisData);
                    if (fetchedAnalysisData) {
                        setAnalysisData(fetchedAnalysisData);
                    }
                } */
                else {
                    // console.log('No analysis data found within praxisData or google_place_id missing.');
                }

            } catch (err) {
                console.error('Error fetching praxis details:', err);
                setError('Die Daten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
            } finally {
                setLoading(false);
            }
        };

        fetchPraxisDetail();
    }, [stadtSlug, praxisSlug]);

    // --- Render Logic (Loading, Error, Success states) --- 

    if (loading) {
        // TODO: Implement Skeleton Loader for Detail Page
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-16 h-16 border-4 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !praxis) {
        return (
            <div className="p-8 text-center">
                <h1 className="mb-4 text-2xl font-bold text-red-600">Fehler</h1>
                <p className="mb-6 text-gray-700">{error || 'Die Praxisdaten konnten nicht geladen werden.'}</p>
                <Link href="/">
                    <Button variant="destructive">Zurück zur Startseite</Button>
                </Link>
            </div>
        );
    }

    // Successful data load - Render the page content
    const currentStadtSlug = typeof stadtSlug === 'string' ? stadtSlug : '';
    const stadtName = capitalizeCity(currentStadtSlug);

    return (
        <TooltipProvider>
            {/* SchemaOrgJsonLd is data-only, can stay but needs props */}
            <SchemaOrgJsonLd
                praxis={praxis}
                stadtSlug={currentStadtSlug}
                praxisSlug={praxisSlug as string}
            />

            {/* Breadcrumbs */}
            <nav className="mb-6 text-sm text-muted-foreground flex items-center space-x-1">
                <Link href="/" className="hover:text-primary">Startseite</Link>
                <ChevronRight className="h-4 w-4" />
                <Link href={`/hautarzt/${currentStadtSlug}`} className="hover:text-primary">{`Hautärzte in ${stadtName}`}</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-foreground">{praxis.name}</span>
            </nav>

            <div className="">
                <PraxisHeader praxis={praxis} />

                <div className="grid grid-cols-1 gap-8 mt-8 lg:grid-cols-3">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Services/Subtypes FIRST */}
                        <LeistungenSection services={praxis.services} subtypes={praxis.subtypes} />

                        {/* Summary Section SECOND */}
                        {praxis.analysis?.zusammenfassung && (
                            <Alert variant="default" className="bg-blue-50 border-blue-200">
                                <ClipboardList className="h-4 w-4 text-blue-700" />
                                <AlertTitle className="text-blue-800">Zusammenfassung der Patienteneinblicke</AlertTitle>
                                <AlertDescription className="text-blue-700">{praxis.analysis.zusammenfassung}</AlertDescription>
                            </Alert>
                        )}

                        {/* KI Dashboard THIRD */}
                        {praxis.analysis && (
                            <KiDashboard analysisData={praxis.analysis} />
                        )}

                        {/* Description FOURTH (if exists) */}
                        {praxis.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Beschreibung</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{praxis.description}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Praxis Information (Contact, Map, Hours, Access.) HERE */}
                        <PraxisInfoSection praxis={praxis} />
                        {/* Last updated info Card HERE */}
                        {praxis.updated_at && (
                            <Card>
                                <CardContent className="p-4 text-sm">
                                    <p className="flex items-center gap-2 text-gray-600">
                                        <Info className="flex-shrink-0 w-4 h-4" aria-hidden="true" />
                                        Letzte Aktualisierung: {new Date(praxis.updated_at).toLocaleDateString('de-DE')}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
} 