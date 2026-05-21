// Creates a Razorpay order + a pending donation row. Returns the checkout
// payload the browser needs to open the Razorpay modal.
//
// Called from the donor portal when someone clicks a product or "Sponsor this
// bird." The browser receives { key_id, order_id, donation_id, amount, ... }
// and hands it to Razorpay Checkout. On payment success, our existing
// `razorpay-webhook` Edge Function fires (payment.captured) → marks donation
// paid → fires `issue-80g-receipt`.
//
// This endpoint is browser-callable and uses RLS-friendly inputs. Amount is
// validated against the product price to prevent a tampered payload from
// charging the wrong amount.
//
// SECURITY: never trust the client's amount when a product_id is supplied —
// look up the canonical amount from donation_products. For sponsorships
// (case_id with no product_id), use a fixed CASE_SPONSORSHIP_INR.

import { preflight, corsHeaders } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/supabase.ts';

const KEY_ID     = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

const CASE_SPONSORSHIP_INR = 2000; // matches the PRD + Sponsor.tsx copy
const MIN_DONATION_INR = 50;
const MAX_DONATION_INR = 1_000_000; // 10 lakh cap; bigger donations need a chat

interface Body {
  org_id: string;
  product_id?: string;
  case_id?: string;
  amount_inr?: number; // only honored when neither product_id nor case_id is set ("custom" donations, future)
  donor: {
    name: string;
    email: string;
    phone_e164?: string;
    pan?: string;
    display_consent?: boolean;
  };
}

Deno.serve(async (req) => {
  const pre = preflight(req); if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  if (!KEY_ID || !KEY_SECRET) return json({ error: 'razorpay not configured' }, 500);

  let body: Body;
  try { body = await req.json(); }
  catch { return json({ error: 'bad json' }, 400); }

  if (!body.org_id) return json({ error: 'org_id required' }, 400);
  if (!body.donor?.name || !body.donor?.email) {
    return json({ error: 'donor name + email required for receipt' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.donor.email)) {
    return json({ error: 'invalid email' }, 400);
  }
  if (body.donor.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(body.donor.pan)) {
    return json({ error: 'invalid PAN format' }, 400);
  }

  const supa = serviceClient();

  // Resolve the canonical amount.
  let amountInr: number;
  let label = 'Donation';
  if (body.product_id) {
    const { data: p, error } = await supa
      .from('donation_products')
      .select('amount_inr, label, is_active, org_id')
      .eq('id', body.product_id)
      .maybeSingle();
    if (error || !p) return json({ error: 'product not found' }, 404);
    if (!p.is_active) return json({ error: 'product inactive' }, 400);
    if (p.org_id !== body.org_id) return json({ error: 'product/org mismatch' }, 400);
    amountInr = p.amount_inr;
    label = p.label;
  } else if (body.case_id) {
    const { data: c, error } = await supa
      .from('cases').select('org_id, short_id').eq('id', body.case_id).maybeSingle();
    if (error || !c) return json({ error: 'case not found' }, 404);
    if (c.org_id !== body.org_id) return json({ error: 'case/org mismatch' }, 400);
    amountInr = CASE_SPONSORSHIP_INR;
    label = `Sponsor ${c.short_id}`;
  } else if (typeof body.amount_inr === 'number' && body.amount_inr >= MIN_DONATION_INR) {
    amountInr = Math.floor(body.amount_inr);
    label = 'Custom donation';
  } else {
    return json({ error: 'product_id, case_id, or amount_inr required' }, 400);
  }

  if (amountInr < MIN_DONATION_INR || amountInr > MAX_DONATION_INR) {
    return json({ error: `amount must be between ₹${MIN_DONATION_INR} and ₹${MAX_DONATION_INR}` }, 400);
  }

  // Upsert donor by (org_id, email).
  const { data: donor, error: donorErr } = await supa
    .from('donors')
    .upsert(
      {
        org_id: body.org_id,
        name: body.donor.name.trim(),
        email: body.donor.email.trim().toLowerCase(),
        phone_e164: body.donor.phone_e164?.trim() ?? null,
        pan: body.donor.pan?.toUpperCase() ?? null,
        display_consent: body.donor.display_consent ?? false,
      },
      { onConflict: 'org_id,email' },
    )
    .select('id')
    .single();
  if (donorErr) return json({ error: 'donor upsert failed', detail: donorErr.message }, 500);

  // Create the order in Razorpay.
  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(`${KEY_ID}:${KEY_SECRET}`),
    },
    body: JSON.stringify({
      amount: amountInr * 100, // paise
      currency: 'INR',
      receipt: `org_${body.org_id.slice(0, 8)}_${Date.now()}`,
      notes: {
        org_id: body.org_id,
        product_id: body.product_id ?? '',
        case_id: body.case_id ?? '',
        donor_id: donor.id,
      },
    }),
  });

  if (!rzpRes.ok) {
    const detail = await rzpRes.text();
    return json({ error: 'razorpay order create failed', detail }, 502);
  }
  const order = await rzpRes.json() as { id: string; amount: number; currency: string };

  // Insert pending donation. The webhook will flip it to paid on capture.
  const { data: donation, error: donErr } = await supa
    .from('donations')
    .insert({
      org_id: body.org_id,
      donor_id: donor.id,
      product_id: body.product_id ?? null,
      case_id: body.case_id ?? null,
      amount_inr: amountInr,
      status: 'pending',
      razorpay_order: order.id,
    })
    .select('id')
    .single();
  if (donErr) return json({ error: 'donation insert failed', detail: donErr.message }, 500);

  return json({
    key_id: KEY_ID,
    order_id: order.id,
    donation_id: donation.id,
    amount: order.amount,   // in paise — what Checkout expects
    currency: order.currency,
    name: label,
    donor: {
      name: body.donor.name,
      email: body.donor.email,
      contact: body.donor.phone_e164 ?? '',
    },
  });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
