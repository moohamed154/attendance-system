/**
 * Rate Limiting Utility
 *
 * Current implementation: In-memory sliding window (per serverless instance).
 * Suitable for single-instance deployments and development.
 *
 * ─────────────────────────────────────────────────────────────────
 * UPSTASH MIGRATION (when you have credentials):
 * ─────────────────────────────────────────────────────────────────
 * 1. npm install @upstash/redis @upstash/ratelimit
 * 2. Add to .env.local:
 *      UPSTASH_REDIS_REST_URL=https://...
 *      UPSTASH_REDIS_REST_TOKEN=...
 * 3. Replace the entire implementation below with:
 *
 *    import { Redis } from '@upstash/redis';
 *    import { Ratelimit } from '@upstash/ratelimit';
 *
 *    const redis = Redis.fromEnv();
 *
 *    // Cache limiters per key to avoid recreating on every request
 *    const limiters = new Map<string, Ratelimit>();
 *
 *    function getLimiter(key: string, limit: number, windowMs: number) {
 *      const cacheKey = `${key}:${limit}:${windowMs}`;
 *      if (!limiters.has(cacheKey)) {
 *        limiters.set(cacheKey, new Ratelimit({
 *          redis,
 *          limiter: Ratelimit.slidingWindow(limit, `${windowMs / 1000} s`),
 *          analytics: true,
 *          prefix: `rl:${key}`,
 *        }));
 *      }
 *      return limiters.get(cacheKey)!;
 *    }
 *
 *    export async function rateLimit(key: string, limit: number, windowMs: number) {
 *      const headerList = await headers();
 *      const ip = headerList.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1';
 *      const limiter = getLimiter(key, limit, windowMs);
 *      const { success, limit: lim, remaining, reset } = await limiter.limit(ip);
 *      return {
 *        success,
 *        count: lim - remaining,
 *        limit: lim,
 *        reset: Math.ceil((reset - Date.now()) / 1000),
 *      };
 *    }
 * ─────────────────────────────────────────────────────────────────
 *
 * Public API (callers do NOT change when migrating):
 *   rateLimit(key: string, limit: number, windowMs: number)
 *   Returns: { success: boolean, count: number, limit: number, reset: number }
 */

import { headers } from 'next/headers';

/** Per-IP sliding window record */
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store — resets on each serverless cold-start
const ipCache = new Map<string, RateLimitRecord>();

/**
 * Rate limits a request by IP address using an in-memory sliding window.
 *
 * @param key     - Unique action key (e.g., 'login', 'pdf-export')
 * @param limit   - Maximum allowed requests per window
 * @param windowMs - Window duration in milliseconds
 */
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const headerList = await headers();
  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerList.get('x-real-ip') ??
    '127.0.0.1';

  const cacheKey = `${key}:${ip}`;
  const now = Date.now();
  const record = ipCache.get(cacheKey);

  if (!record || now > record.resetAt) {
    ipCache.set(cacheKey, { count: 1, resetAt: now + windowMs });
    return { success: true, count: 1, limit, reset: Math.ceil(windowMs / 1000) };
  }

  if (record.count >= limit) {
    return {
      success: false,
      count: record.count,
      limit,
      reset: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    success: true,
    count: record.count,
    limit,
    reset: Math.ceil((record.resetAt - now) / 1000),
  };
}
