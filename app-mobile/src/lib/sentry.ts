import * as Sentry from '@sentry/react-native';

const PAN_RE   = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;
const PHONE_RE = /\+?91[\s-]?\d{5}[\s-]?\d{5}/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

function scrub(s: string): string {
  return s.replace(PAN_RE, '[redacted-pan]')
          .replace(PHONE_RE, '[redacted-phone]')
          .replace(EMAIL_RE, '[redacted-email]');
}

export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_ENV ?? 'development',
    tracesSampleRate: 0.1,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30_000,
    beforeSend(event) {
      try {
        if (event.message) event.message = scrub(event.message);
        if (event.exception?.values) {
          for (const v of event.exception.values) {
            if (v.value) v.value = scrub(v.value);
          }
        }
      } catch { /* never fail to send */ }
      return event;
    },
  });
}

export { Sentry };
