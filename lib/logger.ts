/**
 * Centralized logger utility.
 *
 * In development: logs to console.
 * In production: logs to console.error (can be swapped for Sentry/Datadog later).
 *
 * NEVER log sensitive data (passwords, tokens, full DB records).
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, unknown>;
}

function formatLog(entry: LogEntry): string {
  const timestamp = new Date().toISOString();
  const ctx = entry.context ? ` [${entry.context}]` : '';
  return `[${timestamp}]${ctx} ${entry.message}`;
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
    // TODO: Swap this for an external monitoring service (e.g. Sentry) in production.
    // Example: Sentry.captureException(new Error(message), { extra: metadata });
  },

  debug(message: string, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLog({ level: 'debug', message, context }));
    }
  },
};
