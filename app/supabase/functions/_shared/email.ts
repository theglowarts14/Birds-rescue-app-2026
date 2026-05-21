// Resend wrapper. Single send-email helper used by issue-80g-receipt (and
// later: forget-me confirmation, sponsorship updates). Returns a small typed
// result so callers can record the send status without rethrowing.
//
// Reference: https://resend.com/docs/api-reference/emails/send-email
//
// Required env:
//   RESEND_API_KEY        — server-only; from resend.com
//   RECEIPTS_FROM         — verified sender, e.g. "Karuna · AWCS <receipts@karuna.app>"
//                           Falls back to a generic onboarding@resend.dev for
//                           local testing (Resend allows this on free tier
//                           without domain verification).
//
// Failure modes never throw — they return { ok: false, error } so the caller
// can store the status and move on. Losing an email is bad; losing a receipt
// because of an email failure is worse.

const RESEND_API = 'https://api.resend.com/emails';
const KEY  = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM = Deno.env.get('RECEIPTS_FROM') ?? 'Karuna <onboarding@resend.dev>';

export interface SendInput {
  to: string;
  subject: string;
  html: string;
  text?: string;        // plain-text alternative (recommended)
  reply_to?: string;
  attachments?: { filename: string; content?: string; path?: string }[];
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
}

export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(input: SendInput): Promise<SendResult> {
  if (!KEY) return { ok: false, error: 'RESEND_API_KEY not configured' };
  if (!input.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.to)) {
    return { ok: false, error: 'invalid recipient email' };
  }

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.reply_to,
        attachments: input.attachments,
        headers: input.headers,
        tags: input.tags,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${detail.slice(0, 200)}` };
    }

    const body = await res.json() as { id?: string };
    return { ok: true, id: body.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
