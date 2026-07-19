import { logger } from './logger';
import { getRequestId } from './request-id';
import * as Sentry from '@sentry/nextjs';
import { getSession } from './auth';

export interface AppErrorOptions {
  action: string;
  route?: string;
  metadata?: Record<string, unknown>;
}

export async function handleActionError(error: any, options: AppErrorOptions) {
  const timestamp = new Date().toISOString();
  const errorId = 'err_' + Math.random().toString(36).substring(2, 10).toUpperCase();
  const reqId = getRequestId();
  
  let userId = 'system';
  try {
    const session = await getSession();
    if (session?.id) userId = String(session.id);
  } catch {
    // Session context might not be available
  }

  // Structured messages
  const messageEn = `An unexpected error occurred. Error ID: ${errorId}`;
  const messageAr = `حدث خطأ غير متوقع. رمز الخطأ: ${errorId}`;

  // Log structured JSON
  logger.error(
    `Action Failure [${options.action}]: ${error.message || String(error)}`,
    options.action,
    {
      errorId,
      requestId: reqId,
      timestamp,
      userId,
      action: options.action,
      route: options.route || 'unknown',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      ...options.metadata,
    }
  );

  // Ship to Sentry
  try {
    Sentry.captureException(error, {
      tags: {
        action: options.action,
        errorId,
        requestId: reqId,
      },
      user: { id: userId },
      extra: {
        route: options.route,
        timestamp,
        ...options.metadata,
      },
    });
  } catch {
    // Sentry fallback
  }

  return {
    error: messageEn,
    errorAr: messageAr,
    errorId,
    success: false as const,
  };
}
