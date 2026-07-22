import { logger } from './logger';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000
): { success: boolean; remaining: number; resetTime: number; reset: number } {
  if (process.env.PLAYWRIGHT_TEST === 'true' || process.env.NODE_ENV === 'test') {
    const resTime = Date.now() + windowMs;
    return { success: true, remaining: maxRequests, resetTime: resTime, reset: resTime };
  }

  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetTime) {
    const resTime = now + windowMs;
    store.set(identifier, { count: 1, resetTime: resTime });
    return { success: true, remaining: maxRequests - 1, resetTime: resTime, reset: resTime };
  }

  if (entry.count >= maxRequests) {
    logger.warn(`Rate limit exceeded for identifier: ${identifier}`);
    return { success: false, remaining: 0, resetTime: entry.resetTime, reset: entry.resetTime };
  }

  entry.count += 1;
  return { success: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime, reset: entry.resetTime };
}

export function rateLimit(identifier: string, limit?: number, windowMs?: number) {
  return checkRateLimit(identifier, limit, windowMs);
}
