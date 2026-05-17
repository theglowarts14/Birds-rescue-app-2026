// Razorpay webhook → mark donations paid + kick off 80G receipt issuance.
//
// Wire up in the Razorpay dashboard: Webhooks → Add → URL: this function's
// public URL → Subscribe to events: payment.captured, payment.failed,
// subscription.charged, subscription.cancelled → Secret: a long random string,
// the same one you store in this function's env as RAZORPAY_WEBHOOK_SECRET.
//
// Failure modes:
//  - signature mismatch → 401 (logged; Razorpay will retry)
//  - donation row not found → 200 (don't make Razorpay retry; log to Sentry)
//  - receipt issuance fails → 200 to Razorpay; receipt job retried by trigger
//
// SECURITY: this endpoint is public. The HMAC check is the gate.

import { preflight, corsHeaders } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/supabase.ts';
import { verifyRazorpayWebhook } from '../_shared/verify-razorpay.ts';

const SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? '';

Deno.serve(async (req) => {
  const pre = preflight(req); if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const raw = await req.text();
  const sig = req.headers.get('x-razorpay-signature') ?? '';
  if (!await verifyRazorpayWebhook(raw, sig, SECRET)) {
    return json({ error: 'invalid signature' }, 401);
  }

  let event: RazorpayEvent;
  try { event = JSON.parse(raw); }
  catch { return json({ error: 'bad json' }, 400); }

  const supa = serviceClient();
  const log = (msg: string, extra?: unknown) => console.log(`[razorpay] ${msg}`, extra ?? '');

  try {
    switch (event.event) {
      case 'payment.captured': {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;
        log('payment.captured', { orderId, paymentId: payment.id, amount: payment.amount });

        const { data: donation, error } = await supa
          .from('donations')
          .update({
            status: 'paid',
            razorpay_payment: payment.id,
            paid_at: new Date().toISOString(),
          })
          .eq('razorpay_order', orderId)
          .select('id, donor_id, org_id, amount_inr, case_id')
          .maybeSingle();

        if (error) { log('update failed', error); return json({ ok: true }, 200); }
        if (!donation) { log('no donation row matched order'); return json({ ok: true }, 200); }

        if (donation.case_id) {
          await supa.from('cases').update({ sponsor_id: donation.id }).eq('id', donation.case_id);
          await supa.from('case_events').insert({
            case_id: donation.case_id, org_id: donation.org_id,
            kind: 'sponsored',
            payload: { donation_id: donation.id, amount_inr: donation.amount_inr },
          });
        }

        const issueUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/issue-80g-receipt`;
        fetch(issueUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ donation_id: donation.id }),
        }).catch((e) => log('receipt invocation failed', e));

        return json({ ok: true });
      }

      case 'payment.failed': {
        const payment = event.payload.payment.entity;
        await supa.from('donations').update({ status: 'failed' })
          .eq('razorpay_order', payment.order_id);
        return json({ ok: true });
      }

      case 'subscription.charged': {
        const sub = event.payload.subscription.entity;
        const payment = event.payload.payment.entity;
        const { data: original } = await supa
          .from('donations')
          .select('org_id, donor_id, product_id, amount_inr')
          .eq('razorpay_sub', sub.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (original) {
          await supa.from('donations').insert({
            ...original,
            status: 'paid',
            razorpay_sub: sub.id,
            razorpay_payment: payment.id,
            paid_at: new Date().toISOString(),
          });
        }
        return json({ ok: true });
      }

      case 'subscription.cancelled': {
        await supa.from('donations')
          .update({ status: 'recurring-cancelled' })
          .eq('razorpay_sub', event.payload.subscription.entity.id);
        return json({ ok: true });
      }

      default:
        log('ignored event', { kind: event.event });
        return json({ ok: true });
    }
  } catch (e) {
    log('handler error', e);
    return json({ ok: true });
  }
});

interface RazorpayEvent {
  event: string;
  payload: {
    payment: { entity: { id: string; order_id: string; amount: number } };
    subscription: { entity: { id: string } };
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
