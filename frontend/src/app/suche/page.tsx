import { Suspense } from 'react';
import SearchContent from '../../components/search/SearchContent'; // Import the new client component

// Define a loading component to be used as fallback
function SearchLoadingFallback() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="ml-4 text-gray-600">Suchergebnisse werden geladen...</p>
        </div>
    );
}

// This is now a Server Component that delegates client logic to SearchContent
export default function SearchPage() {
    return (
        <Suspense fallback={<SearchLoadingFallback />}>
            <SearchContent />
        </Suspense>
    );
} 