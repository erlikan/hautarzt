'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { MapContainer as MapContainerType, TileLayer as TileLayerType, Marker as MarkerType, Popup as PopupType, useMap as useMapType } from 'react-leaflet';
import type { LatLngExpression, LatLngBoundsExpression } from 'leaflet';
import { PraxisSummary } from '@/types'; // Use PraxisSummary
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // Import Badge
// Import Aspect Icons
import { Clock, Heart, MessageCircle, Award, Home } from 'lucide-react';
// Import Tooltip
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Import these only on the client side
let L: any;
let MapContainer: typeof MapContainerType;
let TileLayer: typeof TileLayerType;
let Marker: typeof MarkerType;
let Popup: typeof PopupType;
let useMap: typeof useMapType;

interface MapViewProps {
    praxen: PraxisSummary[]; // Array of practices
}

// Helper for aspect status (new)
function getAspectIconClassFromStatus(status: 'positive' | 'neutral' | 'negative' | 'unknown'): string {
    switch (status) {
        case 'positive': return "text-green-600";
        case 'negative': return "text-red-600";
        default: return "text-gray-400"; // neutral or unknown
    }
}

// Helper function to get marker color based on score (6 tiers)
function getMarkerBgColor(score: number | null | undefined): string {
    if (score === null || score === undefined) return 'bg-gray-400'; // Unknown
    if (score < 30) return 'bg-red-600';        // Very Low
    if (score < 45) return 'bg-orange-500';   // Low
    if (score < 60) return 'bg-yellow-500';   // Below Average
    if (score < 75) return 'bg-lime-500';     // Average / Good
    if (score < 90) return 'bg-green-500';    // Very Good
    return 'bg-emerald-600'; // Excellent
}

// Helper component to set map view
function SetMapView({ bounds }: { bounds: LatLngBoundsExpression | null }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] }); // Add padding
        }
    }, [map, bounds]);
    return null; // This component doesn't render anything
}

// Basic map view component
const MapView: React.FC<MapViewProps> = ({ praxen }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const importModules = async () => {
            const reactLeaflet = await import('react-leaflet');
            MapContainer = reactLeaflet.MapContainer;
            TileLayer = reactLeaflet.TileLayer;
            Marker = reactLeaflet.Marker;
            Popup = reactLeaflet.Popup;
            useMap = reactLeaflet.useMap; // Assign useMap
            L = await import('leaflet');

            // Fix icon issue and create custom divIcons
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: '/marker-icon-2x.png',
                iconUrl: '/marker-icon.png',
                shadowUrl: '/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            // Function to create score-based divIcon
            const createScoreIcon = (score: number | null | undefined) => {
                const bgColorClass = getMarkerBgColor(score);
                return L.divIcon({
                    // Use a slightly different icon style for clarity
                    html: `<span class="absolute top-0 left-0 block w-2 h-2 rounded-full ${bgColorClass} ring-2 ring-white shadow"></span>`,
                    className: 'relative flex justify-center items-center bg-transparent border-none', // Ensure relative positioning for the span
                    iconSize: [10, 10], // Adjust size
                    iconAnchor: [5, 5] // Center anchor
                });
            };

            // Remove pre-created icons - create dynamically instead
            (window as any).createScoreIcon = createScoreIcon;

            setMounted(true);
        };
        importModules();
    }, []);

    // Calculate bounds from markers, only when L is loaded (mounted)
    const bounds = useMemo(() => {
        // Ensure L is loaded and praxen exist
        if (!mounted || !praxen || praxen.length === 0 || !L) return null;

        // Latitude/Longitude are optional now in PraxisSummary, filter needed
        const validCoords = praxen
            .filter(p => p.latitude != null && p.longitude != null)
            .map(p => [p.latitude!, p.longitude!]) as LatLngExpression[];

        if (validCoords.length === 0) return null;

        // Uses `getBoundingClientRect` which forces layout measurement.
        // We should avoid calling this method frequently.
        // console.log("Calculating bounds with coords:", validCoords);
        return L.latLngBounds(validCoords);
        // No need to handle length === 1 separately, latLngBounds handles it.

        // Recalculate if praxen array changes OR when mounted becomes true
    }, [praxen, mounted]);

    // Determine initial center/zoom (always used for initial load)
    const initialCenter: LatLngExpression = [51.16, 10.45]; // Default center (Germany)
    const initialZoom = 6; // Default zoom

    if (!mounted) {
        return (
            <div className="h-full w-full bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
                <span>Karte wird geladen...</span>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <MapContainer
                // Always use initial center/zoom for initial map setup
                center={initialCenter}
                zoom={initialZoom}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mounted && bounds && <SetMapView bounds={bounds} />}
                {praxen.map((praxis) => {
                    // Check for lat/lon as they are optional
                    if (praxis.latitude == null || praxis.longitude == null) return null;
                    const position: LatLngExpression = [praxis.latitude, praxis.longitude];
                    // Use top-level score
                    const score = praxis.overall_score;
                    // console.log(`MapView - Praxis: ${praxis.name}, Exact Score: ${score}`);

                    // Create icon dynamically using the function stored on window
                    const markerIcon = (window as any).createScoreIcon
                        ? (window as any).createScoreIcon(score)
                        : L.Icon.Default.prototype;

                    // Use google_place_id for key
                    return (
                        <Marker key={praxis.google_place_id} position={position} icon={markerIcon}>
                            <Popup>
                                <div className="font-semibold text-base mb-1">{praxis.name}</div>
                                {/* Use new field names */}
                                <p className="text-sm text-muted-foreground mb-2">{praxis.address}, {praxis.postal_code}</p>
                                <div className="flex flex-wrap items-center gap-2 mb-2 border-t pt-2 mt-2">
                                    {/* Use top-level score */}
                                    {score !== null && score !== undefined && (
                                        <Badge variant={score >= 70 ? 'default' : score >= 40 ? 'outline' : 'destructive'} className="text-xs">
                                            Score: {score.toFixed(1)}
                                        </Badge>
                                    )}
                                    {/* Use new aspect status object */}
                                    {praxis.analysis_aspects_status && (
                                        <>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Clock className={`w-4 h-4 ${getAspectIconClassFromStatus(praxis.analysis_aspects_status.termin_wartezeit)}`} />
                                                </TooltipTrigger>
                                                <TooltipContent side="top"><p>Termin/Wartezeit</p></TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Heart className={`w-4 h-4 ${getAspectIconClassFromStatus(praxis.analysis_aspects_status.freundlichkeit_empathie)}`} />
                                                </TooltipTrigger>
                                                <TooltipContent side="top"><p>Freundlichkeit</p></TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <MessageCircle className={`w-4 h-4 ${getAspectIconClassFromStatus(praxis.analysis_aspects_status.aufklaerung_vertrauen)}`} />
                                                </TooltipTrigger>
                                                <TooltipContent side="top"><p>Aufklärung/Vertrauen</p></TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Award className={`w-4 h-4 ${getAspectIconClassFromStatus(praxis.analysis_aspects_status.kompetenz_behandlung)}`} />
                                                </TooltipTrigger>
                                                <TooltipContent side="top"><p>Kompetenz</p></TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Home className={`w-4 h-4 ${getAspectIconClassFromStatus(praxis.analysis_aspects_status.praxis_ausstattung)}`} />
                                                </TooltipTrigger>
                                                <TooltipContent side="top"><p>Praxis/Ausstattung</p></TooltipContent>
                                            </Tooltip>
                                        </>
                                    )}
                                </div>
                                {/* Link construction needs to use top-level slugs from PraxisSummary */}
                                <Link href={praxis.city_slug && praxis.slug ? `/hautarzt/${praxis.city_slug}/${praxis.slug}` : '#'} passHref>
                                    <Button variant="link" size="sm" className="p-0 h-auto">Details anzeigen</Button>
                                </Link>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </TooltipProvider>
    );
};

export default MapView; 