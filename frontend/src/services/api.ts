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

// Interface for search parameters - REVISED for new API structure
export interface SearchPraxenParams {
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
    // Get list of all services
    async getServices(): Promise<Service[]> {
        try {
            const { data, error } = await supabase
                .from('service')
                .select('id, name')
                .order('name', { ascending: true });

            if (error) {
                console.error('Error fetching services:', error);
                return [];
            }
            return data || [];
        } catch (err) {
            console.error('Exception in getServices:', err);
            return [];
        }
    },

    // Get practice details by slug - TODO: Refactor to use /api/praxis-details endpoint
    async getPraxisDetailBySlug(stadtSlug: string, praxisSlug: string): Promise<PraxisDetail | null> {
        try {
            // TEMPORARY - Replace with fetch call to Edge Function
            // Explicitly select required fields, including new ones
            const selectQuery = `
                *,
                analysis:praxis_analysis(*),
                services:service(*)
            `;

            const { data, error } = await supabase
                .from('praxis') // Correct table name
                .select(selectQuery)
                .eq('slug', praxisSlug)
                // .eq('city_slug', stadtSlug) // Need a city slug column or different filter logic
                .single();

            if (error) {
                console.error('Error fetching praxis details:', error);
                return null;
            }
            // TODO: Need proper mapping to PraxisDetail type from function response
            return data as any; // Cast needed until fetch/mapping is done
        } catch (err) {
            console.error('Exception in getPraxisDetailBySlug:', err);
            return null;
        }
    },

    // Search praxen using the Edge Function - REVISED to use new params
    async searchPraxen(params: SearchPraxenParams): Promise<{ data: PraxisSummary[]; meta: any }> {
        try {
            const queryParams = new URLSearchParams();

            // Map SearchPraxenParams keys to query string keys expected by the Edge Function
            // (Names might differ slightly, adjust if needed)
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

            const searchUrl = `/api/praxis-search?${queryParams.toString()}`;

            const response = await fetch(searchUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                let errorBody = 'Unknown error';
                try {
                    // Try to parse error body as JSON first
                    const errorJson = await response.json();
                    errorBody = errorJson.error || JSON.stringify(errorJson);
                } catch (e) {
                    // Fallback to text if JSON parsing fails
                    try {
                        errorBody = await response.text();
                    } catch (textErr) {
                        // Ignore if text body also fails
                    }
                }
                console.error('Search request failed:', response.status, errorBody);
                // Throw custom error with status and message
                throw new ApiError(`Search request failed: ${errorBody}`, response.status);
            }

            const result = await response.json();

            if (!result || !result.data || !Array.isArray(result.data)) {
                console.warn("API Service: No valid data array received.");
                // Consider throwing an error here too if needed
                return { data: [], meta: result.meta || {} };
            }

            const responseData: PraxisSummary[] = result.data || [];
            return { data: responseData, meta: result.meta || {} };

        } catch (err) {
            // Check if it's already an ApiError, otherwise wrap it
            if (err instanceof ApiError) {
                console.error(`ApiError in searchPraxen (${err.status}):`, err.message);
                throw err; // Re-throw the original ApiError
            } else {
                // Wrap other errors (e.g., network errors) for consistency
                let errorMessage = 'An unexpected error occurred';
                if (err instanceof Error) { // Check if err is an Error instance
                    errorMessage = err.message;
                }
                console.error('Exception in searchPraxen:', err); // Log the original error
                throw new ApiError(errorMessage, 500); // Default to 500 for unknown fetch errors
            }
        }
    },

    // Get analysis data - Keep as is for now, but might be redundant if details endpoint includes it
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
