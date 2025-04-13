'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { MapContainer as MapContainerType, TileLayer as TileLayerType, Marker as MarkerType, Popup as PopupType } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

// Import these only on the client side
let L: any;
let MapContainer: typeof MapContainerType;
let TileLayer: typeof TileLayerType;
let Marker: typeof MarkerType;
let Popup: typeof PopupType;

interface PraxisMapProps {
    name: string;
    latitude: number | null;
    longitude: number | null;
    address: string;
}

const PraxisMap: React.FC<PraxisMapProps> = ({ name, latitude, longitude, address }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Import Leaflet and react-leaflet components only on client-side
        const importModules = async () => {
            const reactLeaflet = await import('react-leaflet');
            MapContainer = reactLeaflet.MapContainer;
            TileLayer = reactLeaflet.TileLayer;
            Marker = reactLeaflet.Marker;
            Popup = reactLeaflet.Popup;

            // Dynamically import Leaflet library only on the client-side
            L = await import('leaflet');

            // Fix Leaflet default icon issue
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: '/marker-icon-2x.png',
                iconUrl: '/marker-icon.png',
                shadowUrl: '/marker-shadow.png',
            });

            setMounted(true);
        };

        importModules();
    }, []);

    // If coordinates are missing or component not mounted, show placeholder
    if (!latitude || !longitude || !mounted) {
        return (
            <div className="h-full w-full bg-muted rounded flex items-center justify-center text-muted-foreground text-sm">
                <span>
                    {!latitude || !longitude
                        ? 'Keine Karteninfo'
                        : 'Karte wird geladen...'}
                </span>
            </div>
        );
    }

    const position: LatLngExpression = [latitude, longitude];

    return (
        <MapContainer
            center={position}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            className="rounded-md z-0"
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
                <Popup>
                    <div className="font-medium">{name}</div>
                    <div className="text-sm text-gray-600">{address}</div>
                </Popup>
            </Marker>
        </MapContainer>
    );
};

export default PraxisMap; 