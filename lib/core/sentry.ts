import * as Sentry from '@sentry/react-native';

let initialized = false;

export function getSentryDsn(): string | null {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  return dsn || null;
}

export function initSentry() {
  if (initialized) return;
  if (process.env.EXPO_PUBLIC_MONITORING_ENABLED !== 'true') return;

  const dsn = getSentryDsn();
  if (!dsn) {
    if (__DEV__) {
      console.warn('[monitoring] EXPO_PUBLIC_MONITORING_ENABLED is true but EXPO_PUBLIC_SENTRY_DSN is missing.');
    }
    return;
  }

  Sentry.init({
    dsn,
    enabled: !__DEV__,
    tracesSampleRate: 0.2,
    attachStacktrace: true,
  });
  initialized = true;
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
    }
    if (error instanceof Error) {
      Sentry.captureException(error);
      return;
    }
    Sentry.captureMessage(String(error), 'error');
  });
}
