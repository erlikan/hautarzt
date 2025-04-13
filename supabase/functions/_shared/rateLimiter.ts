import { Redis } from "https://esm.sh/@upstash/redis@^1.31.6"; // Use Deno compatible client
import type { ServeHandlerInfo } from "https://deno.land/std@0.177.0/http/server.ts";

// --- Configuration --- 
// Read from environment variables, provide defaults
const UPSTASH_URL = Deno.env.get("UPSTASH_REDIS_REST_URL");
const UPSTASH_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
const WINDOW_SECONDS = parseInt(Deno.env.get("RATE_LIMIT_WINDOW_SECONDS") || '60', 10);
const MAX_REQUESTS = parseInt(Deno.env.get("RATE_LIMIT_MAX_REQUESTS") || '60', 10);

let redis: Redis | null = null;

if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
        redis = new Redis({
            url: UPSTASH_URL,
            token: UPSTASH_TOKEN,
        });
        console.log("RateLimiter: Redis client initialized."); // Log success
    } catch (e) {
        console.error("RateLimiter: Failed to initialize Redis client:", e);
        // redis remains null, limiter will fail open
    }
} else {
    console.warn("RateLimiter: Upstash Redis environment variables not set. Rate limiting disabled.");
}

/**
 * Checks if a request from a given IP address has exceeded the rate limit.
 * Uses a fixed window counter algorithm with Upstash Redis.
 * 
 * @param request The incoming Request object.
 * @param connInfo The connection info containing the remote address.
 * @returns Promise<boolean> - True if the request is allowed, False if rate limited.
 */
export async function checkRateLimit(request: Request, connInfo: ServeHandlerInfo): Promise<boolean> {
    if (!redis) {
        // Redis client not initialized (config missing or error), fail open
        console.warn("RateLimiter: Check skipped, Redis client not available.")
        return true;
    }

    try {
        // --- Get Client IP --- 
        const forwardedFor = request.headers.get('x-forwarded-for');
        // Deno.serve connInfo.remoteAddr is { transport: "tcp" | "udp"; hostname: string; port: number; }
        let ip = connInfo.remoteAddr.hostname;
        if (forwardedFor) {
            ip = forwardedFor.split(',')[0].trim();
        }

        if (!ip) {
            console.warn("RateLimiter: Could not determine client IP address.");
            return true; // Fail open if IP cannot be determined
        }

        const key = `rate_limit:${ip}`; // Key for the fixed window counter

        // --- Perform Rate Limiting Check --- 
        // Use pipelining for efficiency
        const pipe = redis.pipeline();
        pipe.incr(key);
        pipe.expire(key, WINDOW_SECONDS); // Set expiration on every hit (harmless)
        const results = await pipe.exec<[number, number]>();

        const currentCount = results[0]; // Result of INCR

        if (currentCount > MAX_REQUESTS) {
            // Limit exceeded
            console.log(`Rate limit exceeded for IP: ${ip}. Count: ${currentCount}`);
            return false; // Deny request
        }

        // Limit not exceeded
        // console.log(`Rate limit check passed for IP: ${ip}. Count: ${currentCount}`);
        return true; // Allow request

    } catch (error) {
        console.error("RateLimiter: Error checking rate limit with Redis:", error);
        // Fail open in case of Redis errors
        return true;
    }
} 