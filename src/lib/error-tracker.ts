import { logger } from '@/lib/logger';

type ErrorContext = Record<string, unknown>;

export function captureException(error: unknown, context: ErrorContext = {}) {
  logger.error(
    {
      err: error,
      ...context
    },
    'Unhandled error'
  );

  // Hook point for Sentry/New Relic/etc.
  if (process.env.SENTRY_DSN) {
    // Integrate @sentry/nextjs here if desired.
  }
}
