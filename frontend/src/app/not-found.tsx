import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
            <h2 className="text-2xl font-bold mb-2">Seite nicht gefunden</h2>
            <p className="text-gray-600 mb-6">Die angeforderte Ressource konnte nicht gefunden werden.</p>
            <Link
                href="/"
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
            >
                Zurück zur Startseite
            </Link>
        </div>
    );
} 