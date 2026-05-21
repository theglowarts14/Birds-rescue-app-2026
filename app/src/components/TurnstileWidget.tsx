import { useEffect, useRef } from 'react';

// Cloudflare Turnstile widget — managed-mode CAPTCHA. Loads the script once
// on mount, renders the widget into a div, and bubbles up the token via
// onToken. Resets on parent unmount.
//
// Reference: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
//
// Site key comes from VITE_TURNSTILE_SITEKEY. When unset, the widget renders
// a fallback notice and `onToken('dev-skip')` immediately so local dev keeps
// working. The Edge Function rejects 'dev-skip' tokens unless TURNSTILE_SECRET_KEY
// is also unset (true dev parity).

declare global {
  interface Window {
    turnstile?: {
      render(el: HTMLElement, opts: {
        sitekey: string;
        callback?: (token: string) => void;
        'error-callback'?: (err: unknown) => void;
        'expired-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
        size?: 'normal' | 'compact' | 'invisible' | 'flexible';
        action?: string;
      }): string;
      reset(widgetId?: string): void;
      remove(widgetId: string): void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
let scriptLoaded: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if (window.turnstile) return Promise.resolve();
  if (scriptLoaded) return scriptLoaded;
  scriptLoaded = new Promise((resolve, reject) => {
    window.onTurnstileLoad = () => resolve();
    const s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.async = true;
    s.defer = true;
    s.onerror = () => { scriptLoaded = null; reject(new Error('Turnstile script failed to load')); };
    document.head.appendChild(s);
  });
  return scriptLoaded;
}

export function TurnstileWidget({ onToken, action }: { onToken: (token: string) => void; action?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITEKEY;

  useEffect(() => {
    if (!siteKey) {
      onToken('dev-skip');
      return;
    }
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          theme: 'light',
          size: 'flexible',
          action: action ?? 'submit-report',
          callback: (token) => onToken(token),
          'error-callback': (err) => console.warn('[turnstile] error', err),
          'expired-callback': () => onToken(''),
        });
      })
      .catch((e) => console.warn('[turnstile] load failed', e));

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try { window.turnstile.remove(widgetId.current); } catch { /* noop */ }
      }
    };
  }, [siteKey, action, onToken]);

  if (!siteKey) {
    return (
      <div className="text-[10px] text-ink-muted text-center font-mono">
        CAPTCHA disabled in dev — set VITE_TURNSTILE_SITEKEY to enable
      </div>
    );
  }

  return <div ref={ref} className="flex justify-center" />;
}
