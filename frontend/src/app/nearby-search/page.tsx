'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MapPinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NearbySearchPage() {
    const router = useRouter();
    const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setStatus('error');
            setErrorMessage('Ihr Browser unterstützt die Standortermittlung nicht.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setStatus('success');
                // Redirect to the actual nearby search page with coordinates
                router.push(`/hautarzt/nearby?lat=${latitude}&lon=${longitude}`);
            },
            (error) => {
                setStatus('error');
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setErrorMessage('Sie haben die Standortfreigabe verweigert. Bitte erlauben Sie den Zugriff oder suchen Sie manuell.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setErrorMessage('Ihr Standort konnte nicht ermittelt werden.');
                        break;
                    case error.TIMEOUT:
                        setErrorMessage('Zeitüberschreitung bei der Standortermittlung.');
                        break;
                    default:
                        setErrorMessage('Ein unbekannter Fehler ist bei der Standortermittlung aufgetreten.');
                        break;
                }
            },
            {
                enableHighAccuracy: false, // Lower accuracy is usually faster and sufficient
                timeout: 10000, // 10 seconds timeout
                maximumAge: 60000 // Allow cached position up to 1 minute old
            }
        );

        // No cleanup needed in this effect
    }, [router]); // Include router in dependency array

    return (
        <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center">
            {status === 'pending' && (
                <>
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <h1 className="text-2xl font-semibold mb-2">Standort wird ermittelt...</h1>
                    <p className="text-muted-foreground">Bitte warten Sie einen Moment oder bestätigen Sie die Standortfreigabe in Ihrem Browser.</p>
                </>
            )}
            {status === 'error' && (
                <>
                    <MapPinOff className="h-12 w-12 text-destructive mb-4" />
                    <h1 className="text-2xl font-semibold mb-2 text-destructive">Standortfehler</h1>
                    <p className="text-muted-foreground mb-6">{errorMessage || 'Der Standort konnte nicht ermittelt werden.'}</p>
                    <Link href="/">
                        <Button variant="outline">Zurück zur Startseite</Button>
                    </Link>
                </>
            )}
            {/* No explicit success message needed as it redirects */}
        </div>
    );
} 