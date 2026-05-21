// Cloudflare Turnstile siteverify wrapper. Free, privacy-friendly CAPTCHA
// alternative — no Google, no cookies, GDPR-friendly.
//
// Reference: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
//
// Required env:
//   TURNSTILE_SECRET_KEY  — from dash.cloudflare.com → Turnstile → site → Settings
//
// If the secret isn't configured we return { ok: true, skipped: true } so the
// rest of the pipeline (rate limit, insert) still runs in dev. Wire this up
// before going to production.

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const SECRET = Deno.env.get('TURNSTILE_SECRET_KEY') ?? '';

export interface TurnstileResult {
  ok: boolean;
  skipped?: boolean;
  errorCodes?: string[];
  hostname?: string;
  challengeTs?: string;
}

export async function verifyTurnstile(token: string | undefined, remoteIp?: string): Promise<TurnstileResult> {
  if (!SECRET) {
    console.warn('[turnstile] TURNSTILE_SECRET_KEY not set; skipping CAPTCHA verification');
    return { ok: true, skipped: true };
  }
  if (!token) return { ok: false, errorCodes: ['missing-input-response'] };

  try {
    const form = new URLSearchParams();
    form.set('secret', SECRET);
    form.set('response', token);
    if (remoteIp) form.set('remoteip', remoteIp);

    const res = await fetch(SITEVERIFY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const body = await res.json() as {
      success: boolean;
      'error-codes'?: string[];
      hostname?: string;
      challenge_ts?: string;
    };
    return {
      ok: body.success === true,
      errorCodes: body['error-codes'],
      hostname: body.hostname,
      challengeTs: body.challenge_ts,
    };
  } catch (e) {
    return { ok: false, errorCodes: ['network-error: ' + (e as Error).message] };
  }
}

/**
 * Read the real client IP from request headers. Vercel sets x-forwarded-for,
 * Cloudflare sets cf-connecting-ip. Falls back to the first value of x-real-ip.
 */
export function clientIp(req: Request): string | null {
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf;
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip');
}
