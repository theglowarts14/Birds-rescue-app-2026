import * as Sentry from '@sentry/react';

const PAN_RE   = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;
const PHONE_RE = /\+?91[\s-]?\d{5}[\s-]?\d{5}/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

function scrub(s: string): string {
  return s.replace(PAN_RE, '[redacted-pan]')
          .replace(PHONE_RE, '[redacted-phone]')
          .replace(EMAIL_RE, '[redacted-email]');
}

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
    beforeSend(event) {
      try {
        if (event.message) event.message = scrub(event.message);
        if (event.request?.url) event.request.url = scrub(event.request.url);
        if (event.exception?.values) {
          for (const v of event.exception.values) {
            if (v.value) v.value = scrub(v.value);
          }
        }
      } catch { /* never fail to send because we couldn't scrub */ }
      return event;
    },
  });
}

export const ErrorBoundary = Sentry.ErrorBoundary;
