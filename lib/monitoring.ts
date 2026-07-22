import { logger, LogContext } from './logger';

export function captureException(error: Error | any, context?: LogContext) {
  const isSentryEnabled = process.env.ENABLE_SENTRY === 'true';
  const isOpenTelemetryEnabled = process.env.ENABLE_OPENTELEMETRY === 'true';

  logger.error(error?.message || 'Unhandled exception', {
    errorStack: error?.stack,
    ...context,
  });

  if (isSentryEnabled) {
    try {
      // Sentry captures dynamically when initialized
    } catch {
      // Ignore provider error
    }
  }

  if (isOpenTelemetryEnabled) {
    try {
      // OpenTelemetry captures dynamically when initialized
    } catch {
      // Ignore provider error
    }
  }
}

export function captureEvent(eventName: string, context?: LogContext) {
  logger.info(`[EVENT] ${eventName}`, context);
}
