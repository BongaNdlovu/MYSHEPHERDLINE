import { captureException, getSentryDsn, initSentry } from '@/lib/core/sentry';

type MonitoringContext = Record<string, string | number | boolean | null | undefined>;

/** Initialize crash reporting once at app startup (see app/_layout.tsx). */
export function initMonitoring() {
  initSentry();
}

/**
 * Reports a non-fatal client error to Sentry when monitoring is configured.
 * Requires EXPO_PUBLIC_MONITORING_ENABLED=true and EXPO_PUBLIC_SENTRY_DSN.
 */
export function reportClientError(error: unknown, context: MonitoringContext = {}) {
  if (process.env.EXPO_PUBLIC_MONITORING_ENABLED !== 'true') {
    if (__DEV__) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('[monitoring:disabled]', { message, ...context });
    }
    return;
  }

  captureException(error, context);
}

/** True when monitoring env flags and a Sentry DSN are present. */
export function isMonitoringConfigured() {
  return process.env.EXPO_PUBLIC_MONITORING_ENABLED === 'true' && Boolean(getSentryDsn());
}
