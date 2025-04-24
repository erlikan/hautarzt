import { createClient } from '@supabase/supabase-js';
import { PraxisDetail, PraxisSummary, PraxisAnalysisData, Service } from '../types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Custom Error class to include status code
class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

// Interface for search parameters
export interface SearchPraxenParams {
    query?: string; // Add the general query term
    // Primary context (usually from URL)
    contextCitySlug?: string;
    // Optional filters
    filterPostalCode?: string;
    filterServiceIds?: number[];
    filterMinScore?: number;
    // Geo params (for distance sort/calc, often from nearby redirect)
    geoLat?: number;
    geoLon?: number;
    geoRadiusMeters?: number;
    // Sorting & Pagination
    sortBy?: 'score' | 'distance' | 'name';
    sortDirection?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
}

// API functions
export const apiService = {
    // --- Private Helper to get Base URL --- 
    _getBaseUrl() {
        // For server-side calls (like metadata generation), use absolute URL
        // For client-side, relative is fine
        // Check if running on server using typeof window
        if (typeof window === 'undefined') {
            // Use environment variable configured for your deployment
            // Ensure NEXT_PUBLIC_BASE_URL is set in Vercel/Netlify/Docker env
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'; // Fallback for local server build
            if (!baseUrl.startsWith('http')) {
                console.warn('Invalid NEXT_PUBLIC_BASE_URL for server-side fetch');
                return 'http://localhost:3000'; // Safer fallback
            }
            return baseUrl;
        }
        // For client-side calls, relative URL is sufficient
        return '';
    },

    // Get list of all RELEVANT services (for filters)
    async getServices(): Promise<Service[]> {
        try {
            const { data, error } = await supabase
                .from('service')
                .select('id, name, is_relevant_dermatology') // Select the flag
                .eq('is_relevant_dermatology', true) // Filter for relevant services
                .order('name', { ascending: true });

            if (error) {
                console.error('Error fetching relevant services:', error);
                return [];
            }
            // Add type assertion here if needed, though Supabase client might infer
            return (data as Service[]) || [];
        } catch (err) {
            console.error('Exception in getServices:', err);
            return [];
        }
    },

    // Get practice details by slug - REVERT TO DIRECT SUPABASE QUERY
    async getPraxisDetailBySlug(stadtSlug: string, praxisSlug: string): Promise<PraxisDetail | null> {
        try {
            // Use Supabase client directly again
            const selectQuery = `
                *,
                analysis:praxis_analysis(*),
                services:service(id, name)
            `;

            const { data, error } = await supabase
                .from('praxis')
                .select(selectQuery)
                .eq('slug', praxisSlug)
                // Add back city slug filter for uniqueness if needed
                .eq('city_slug', stadtSlug)
                .maybeSingle();

            if (error) {
                console.error('Error fetching praxis details:', error);
                // Throw ApiError for consistency
                throw new ApiError(`Database error fetching details: ${error.message}`, 500);
            }
            if (!data) {
                throw new ApiError(`Praxis not found for slug: ${stadtSlug}/${praxisSlug}`, 404);
            }

            // Cast needed as Supabase client returns joined data nested
            return data as PraxisDetail;
        } catch (err) {
            console.error(`Exception in getPraxisDetailBySlug (${stadtSlug}/${praxisSlug}):`, err);
            if (err instanceof ApiError) throw err;
            throw new ApiError('Failed to load practice details.', 500);
        }
    },

    // Search praxen using the Edge Function
    async searchPraxen(params: SearchPraxenParams): Promise<{ data: PraxisSummary[]; meta: any }> {
        try {
            const queryParams = new URLSearchParams();
            // ... (param mapping remains the same) ...
            if (params.contextCitySlug) queryParams.append('stadtSlug', params.contextCitySlug);
            if (params.filterPostalCode) queryParams.append('plz', params.filterPostalCode);
            if (params.filterServiceIds && params.filterServiceIds.length > 0) {
                queryParams.append('services', params.filterServiceIds.join(','));
            }
            if (params.filterMinScore !== undefined && params.filterMinScore !== null) {
                queryParams.append('minScore', String(params.filterMinScore));
            }
            if (params.geoLat !== undefined && params.geoLat !== null) {
                queryParams.append('lat', String(params.geoLat));
            }
            if (params.geoLon !== undefined && params.geoLon !== null) {
                queryParams.append('lon', String(params.geoLon));
            }
            if (params.geoRadiusMeters) queryParams.append('radius', String(params.geoRadiusMeters));
            if (params.sortBy) queryParams.append('sortBy', params.sortBy);
            if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
            if (params.page) queryParams.append('page', String(params.page));
            if (params.pageSize) queryParams.append('pageSize', String(params.pageSize));
            // Add the query parameter if it exists
            if (params.query) queryParams.append('query', params.query);

            // --- Use base URL --- 
            const searchUrl = `${this._getBaseUrl()}/api/praxis-search?${queryParams.toString()}`;

            const response = await fetch(searchUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                let errorBody = 'Unknown error';
                try {
                    const errorJson = await response.json();
                    errorBody = errorJson.error || JSON.stringify(errorJson);
                } catch (e) {
                    try {
                        errorBody = await response.text();
                    } catch (textErr) { }
                }
                console.error('Search request failed:', response.status, errorBody);
                throw new ApiError(`Search request failed: ${errorBody}`, response.status);
            }
            const result = await response.json();
            if (!result || !result.data || !Array.isArray(result.data)) {
                console.warn("API Service: No valid data array received.");
                return { data: [], meta: result.meta || {} };
            }
            const responseData: PraxisSummary[] = result.data || [];
            return { data: responseData, meta: result.meta || {} };

        } catch (err) {
            // ... (error handling remains the same) ...
            if (err instanceof ApiError) {
                console.error(`ApiError in searchPraxen (${err.status}):`, err.message);
                throw err;
            } else {
                let errorMessage = 'An unexpected error occurred';
                if (err instanceof Error) {
                    errorMessage = err.message;
                }
                console.error('Exception in searchPraxen:', err);
                throw new ApiError(errorMessage, 500);
            }
        }
    },

    // Get analysis data - TODO: Remove if detail endpoint includes everything
    async getPraxisAnalysisData(praxisId: string): Promise<PraxisAnalysisData | null> {
        try {
            const { data, error } = await supabase
                .from('praxis_analysis')
                .select('*')
                .eq('praxis_google_place_id', praxisId) // Assuming FK is google_place_id
                .single();

            if (error) {
                console.error('Error fetching praxis analysis data:', error);
                return null;
            }

            return data as PraxisAnalysisData;
        } catch (err) {
            console.error('Exception in getPraxisAnalysisData:', err);
            return null;
        }
    }
};
