import { getRequestId } from './request-id';
import { cache } from 'react';
import { headers } from 'next/headers';

export const getRequestDetails = cache(async () => {
  const reqId = getRequestId();
  let ip = '127.0.0.1';
  let userAgent = 'unknown';

  try {
    const headerList = await headers();
    ip = headerList.get('x-forwarded-for')?.split(',')[0] || headerList.get('x-real-ip') || '127.0.0.1';
    userAgent = headerList.get('user-agent') || 'unknown';
  } catch {
    // next/headers might throw if called outside of request context (e.g. static generation)
  }
  
  return {
    requestId: reqId,
    ip,
    userAgent,
  };
});
