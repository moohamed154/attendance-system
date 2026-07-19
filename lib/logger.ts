/**
 * Centralized logger utility.
 *
 * In development: logs to console.
 * In production: logs to console.error (can be swapped for Sentry/Datadog later).
 *
 * NEVER log sensitive data (passwords, tokens, full DB records).
 */

import { getRequestId } from './request-id';
import * as Sentry from '@sentry/nextjs';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, unknown>;
}

function formatLog(entry: LogEntry): string {
  let reqId = 'unknown';
  try {
    reqId = getRequestId();
  } catch {
    // Outside of request context
  }

  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId: reqId,
      ...entry,
    });
  }
  const timestamp = new Date().toISOString();
  const ctx = entry.context ? ` [${entry.context}]` : '';
  const reqStr = reqId ? ` [${reqId}]` : '';
  const metaStr = entry.metadata ? ` | metadata: ${JSON.stringify(entry.metadata)}` : '';
  return `[${timestamp}]${reqStr}${ctx} ${entry.message}${metaStr}`;
}

export const logger = {
  info(message: string, context?: string, metadata?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      console.info(formatLog({ level: 'info', message, context, metadata }));
    }
  },

  warn(message: string, context?: string, metadata?: Record<string, unknown>) {
    console.warn(formatLog({ level: 'warn', message, context, metadata }));
  },

  error(message: string, context?: string, metadata?: Record<string, unknown>) {
    console.error(formatLog({ level: 'error', message, context, metadata }));
    try {
      Sentry.captureException(new Error(message), {
        tags: { context: context || 'unknown' },
        extra: metadata,
      });
    } catch {
      // Sentry initialization safety fallback
    }
  },

  debug(message: string, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLog({ level: 'debug', message, context }));
    }
  },
};
