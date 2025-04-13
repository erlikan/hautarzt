/**
 * Creates a mock Request object for testing Deno edge functions
 * 
 * @param method HTTP method (GET, POST, etc.)
 * @param url URL instance
 * @param body Optional request body
 * @param headers Optional headers
 * @returns Mocked Request object
 */
export function createMockRequest(
    method: string,
    url: URL,
    body?: BodyInit | null,
    headers?: HeadersInit
): Request {
    return new Request(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body
    });
} 