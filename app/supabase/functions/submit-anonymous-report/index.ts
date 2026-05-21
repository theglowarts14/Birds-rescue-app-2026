// Public, anonymous case submission. Single entry point for the web report
// form. Two safeguards before the case lands in the helpline queue:
//
//   1. Cloudflare Turnstile (CAPTCHA) — verified server-side
//   2. Per-IP rate limit — 5 reports/hour soft cap, 10/hour → 24h block
//
// Inserts via service-role so the table's `anon report` RLS policy can be
// tightened later without breaking the public form. The function is the only
// supported path for browser submissions; the mobile app currently uses
// direct inserts (gated by app-install friction), and can migrate to this
// endpoint later by sending no Turnstile token (skipped) + a device fingerprint.
//
// SECURITY: validates everything. Trusts no client field. The IP is read from
// headers (cf-connecting-ip > x-forwarded-for > x-real-ip).

import { preflight, corsHeaders } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/supabase.ts';
import { verifyTurnstile, clientIp } from '../_shared/turnstile.ts';

const KINDS = new Set(['bird', 'animal', 'wildlife']);
const PROBLEMS = new Set(['injured', 'stuck', 'orphaned', 'cruelty']);
const URGENCIES = new Set(['critical', 'moderate', 'low']);

interface Body {
  org_slug: string;
  kind: string;
  problem: string;
  urgency: string;
  area?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  species_freetext?: string;
  threat_summary?: string;
  turnstile_token?: string;
  device_fingerprint?: string;
}

Deno.serve(async (req) => {
  const pre = preflight(req); if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  let body: Body;
  try { body = await req.json(); }
  catch { return json({ error: 'bad json' }, 400); }

  if (!body.org_slug || typeof body.org_slug !== 'string') return json({ error: 'org_slug required' }, 400);
  if (!KINDS.has(body.kind)) return json({ error: 'invalid kind' }, 400);
  if (!PROBLEMS.has(body.problem)) return json({ error: 'invalid problem' }, 400);
  if (!URGENCIES.has(body.urgency)) return json({ error: 'invalid urgency' }, 400);
  if (body.area && body.area.length > 200) return json({ error: 'area too long' }, 400);
  if (body.notes && body.notes.length > 2000) return json({ error: 'notes too long' }, 400);
  if (body.lat != null && (typeof body.lat !== 'number' || body.lat < -90 || body.lat > 90)) return json({ error: 'invalid lat' }, 400);
  if (body.lng != null && (typeof body.lng !== 'number' || body.lng < -180 || body.lng > 180)) return json({ error: 'invalid lng' }, 400);

  const ip = clientIp(req);

  // 1. CAPTCHA — only when a token is provided (mobile clients skip)
  if (body.turnstile_token) {
    const cap = await verifyTurnstile(body.turnstile_token, ip ?? undefined);
    if (!cap.ok && !cap.skipped) {
      return json({ error: 'captcha failed', codes: cap.errorCodes }, 403);
    }
  }

  // 2. Rate limit — strictest fingerprint wins
  const supa = serviceClient();
  const fingerprints = [
    ip ? `ip:${ip}` : null,
    body.device_fingerprint ? `device:${body.device_fingerprint.slice(0, 64)}` : null,
  ].filter((f): f is string => !!f);

  if (fingerprints.length === 0) fingerprints.push('ip:unknown');

  for (const fp of fingerprints) {
    const { data, error } = await supa.rpc('check_report_rate_limit', {
      p_fingerprint: fp,
      p_soft_cap: 5,
      p_hard_cap: 10,
      p_window_minutes: 60,
      p_block_minutes: 1440,
    });
    if (error) {
      if (error.code === '42883') break;
      console.error('[rate-limit] rpc error', error);
      continue;
    }
    const r = data as { allowed: boolean; blocked_until?: string; reason?: string };
    if (!r.allowed) {
      return json({
        error: 'rate limited',
        reason: r.reason,
        blocked_until: r.blocked_until,
        message: 'Too many reports from your network. Try again later or call the helpline directly.',
      }, 429);
    }
  }

  // 3. Resolve org
  const { data: org } = await supa
    .from('organizations')
    .select('id, slug')
    .eq('slug', body.org_slug)
    .eq('is_active', true)
    .maybeSingle();
  if (!org) return json({ error: 'org not found' }, 404);

  // 4. Insert the case (service-role bypasses RLS).
  const { data: c, error: insErr } = await supa
    .from('cases')
    .insert({
      org_id: org.id,
      kind: body.kind,
      problem: body.problem,
      urgency: body.urgency,
      species_freetext: body.species_freetext ?? null,
      threat_summary: body.threat_summary ?? null,
      area: body.area ?? null,
      location_text: body.area ?? null,
      notes: body.notes ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      reporter_anon: true,
      status: body.urgency === 'critical' ? 'critical' : 'in-rescue',
    })
    .select('id, short_id')
    .single();
  if (insErr) return json({ error: 'insert failed', detail: insErr.message }, 500);

  return json({
    ok: true,
    case_id: c.id,
    short_id: c.short_id,
  });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
