/**
 * Simple in-memory rate limiter for API routes
 * Works well for single-instance deployments (Vercel Edge, etc.)
 * For multi-instance deployments, use Upstash Redis instead
 */

// Store request counts per IP
const rateLimitStore = new Map();

// Clean up old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > data.windowMs) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited
 * @param {string} ip - Client IP address
 * @param {string} endpoint - Endpoint identifier (e.g., 'generate', 'share')
 * @param {object} options - Rate limit options
 * @param {number} options.limit - Max requests per window
 * @param {number} options.windowMs - Time window in milliseconds
 * @returns {{ success: boolean, remaining: number, reset: number }}
 */
export function rateLimit(ip, endpoint, { limit = 10, windowMs = 60000 } = {}) {
  cleanup();

  const key = `${ip}:${endpoint}`;
  const now = Date.now();

  let data = rateLimitStore.get(key);

  // Start new window if none exists or window has expired
  if (!data || now - data.windowStart > windowMs) {
    data = {
      count: 0,
      windowStart: now,
      windowMs
    };
  }

  data.count++;
  rateLimitStore.set(key, data);

  const remaining = Math.max(0, limit - data.count);
  const reset = Math.ceil((data.windowStart + windowMs - now) / 1000);

  return {
    success: data.count <= limit,
    remaining,
    reset,
    limit
  };
}

/**
 * Get client IP from Next.js request
 * @param {Request} request - Next.js request object
 * @returns {string} Client IP address
 */
export function getClientIP(request) {
  // Try various headers in order of preference
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback for local development
  return '127.0.0.1';
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimits = {
  // AI generation - expensive, limit strictly
  generate: { limit: 5, windowMs: 60 * 1000 },      // 5 requests per minute

  // Image generation - also expensive
  generateImage: { limit: 10, windowMs: 60 * 1000 }, // 10 requests per minute

  // Share creation - moderate
  share: { limit: 20, windowMs: 60 * 1000 },         // 20 requests per minute

  // Storage operations - more lenient
  storage: { limit: 60, windowMs: 60 * 1000 },       // 60 requests per minute

  // Default fallback
  default: { limit: 30, windowMs: 60 * 1000 }        // 30 requests per minute
};
