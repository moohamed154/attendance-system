/**
 * Centralized error handling utilities for Server Actions.
 *
 * All server actions should return an `ActionResult<T>` so the client
 * always receives a typed, user-friendly response. Stack traces are
 * never exposed to the client.
 */

import { logger } from '@/lib/logger';

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type ActionVoidResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Wraps a server action body, catches any unhandled exceptions,
 * logs them server-side, and returns a safe error payload to the client.
 */
export async function withErrorHandling<T>(
  context: string,
  fn: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    logger.error(
      err instanceof Error ? err.message : 'Unknown error',
      context,
      { stack: err instanceof Error ? err.stack : undefined }
    );
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Returns a typed success result.
 */
export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

/**
 * Returns a typed error result without exposing internal details.
 */
export function fail<T = void>(message: string): ActionResult<T> {
  return { success: false, error: message };
}

/**
 * Standard error messages for common scenarios.
 */
export const ErrorMessages = {
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_FAILED: 'Invalid input. Please check your data.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again.',
} as const;
