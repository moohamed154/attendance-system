import { headers } from 'next/headers';

// Simple in-memory storage for rate limits
const ipCache = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(key: string, limit: number, windowMs: number) {
  // Retrieve the client IP address from headers
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0] || headerList.get('x-real-ip') || '127.0.0.1';
  
  const cacheKey = `${key}:${ip}`;
  const now = Date.now();
  const record = ipCache.get(cacheKey);
  
  if (!record || now > record.resetAt) {
    ipCache.set(cacheKey, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { success: true, count: 1, limit, reset: Math.ceil(windowMs / 1000) };
  }
  
  if (record.count >= limit) {
    return { success: false, count: record.count, limit, reset: Math.ceil((record.resetAt - now) / 1000) };
  }
  
  record.count += 1;
  return { success: true, count: record.count, limit, reset: Math.ceil((record.resetAt - now) / 1000) };
}
