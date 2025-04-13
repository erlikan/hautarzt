/**
 * Mock environment values for testing
 */
export interface MockEnvValues {
    [key: string]: string;
}

/**
 * Sets up environment variables for testing without modifying Deno.env
 * 
 * @param mockValues An object containing key-value pairs to mock
 * @returns A cleanup function to restore original behavior
 */
export function setupMockEnv(mockValues: MockEnvValues = {}): () => void {
    // Store the original get method
    const originalGet = Deno.env.get;

    // Create a mock get function that returns mocked values or falls back to original
    Deno.env.get = (key: string): string | undefined => {
        if (key in mockValues) {
            return mockValues[key];
        }
        // Fall back to the original implementation
        return originalGet.call(Deno.env, key);
    };

    // Return a cleanup function
    return () => {
        // Restore the original method
        Deno.env.get = originalGet;
    };
} 