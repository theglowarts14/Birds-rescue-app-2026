// Auto-routes non-bird cases to the right partner NGO.
//
// Match rules: kind/problem → partner kind enum. Tunable in production.

import { preflight, corsHeaders } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/supabase.ts';

interface Payload { case_id: string; }

function matchPartnerKind(kind: string, problem: string, notes?: string | null): string | null {
  if (kind === 'wildlife') {
    if (notes?.match(/snake|monitor|reptile/i)) return 'snakes';
    return 'wildlife';
  }
  if (kind === 'animal') {
    if (notes?.match(/cow|cattle|buffalo|horn/i)) return 'cattle';
    if (problem === 'cruelty') return 'cruelty';
    return 'cruelty';
  }
  if (problem === 'cruelty') return 'cruelty';
  if (notes?.match(/borewell|well/i)) return 'borewell';
  return null;
}

Deno.serve(async (req) => {
  const pre = preflight(req); if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const { case_id }: Payload = await req.json();
  if (!case_id) return json({ error: 'case_id required' }, 400);

  const supa = serviceClient();

  const { data: c } = await supa
    .from('cases')
    .select('id, org_id, kind, problem, threat_summary, notes, area')
    .eq('id', case_id)
    .single();
  if (!c) return json({ error: 'case not found' }, 404);

  const partnerKind = matchPartnerKind(c.kind, c.problem, `${c.threat_summary ?? ''} ${c.notes ?? ''}`);
  if (!partnerKind) return json({ ok: true, routed: false });

  const { data: partner } = await supa
    .from('partners')
    .select('id, name, contact_name, contact_phone, is_flag_only, notes')
    .eq('org_id', c.org_id)
    .eq('kind', partnerKind)
    .limit(1)
    .maybeSingle();

  if (!partner) return json({ ok: true, routed: false, reason: 'no partner registered' });

  await supa.from('case_events').insert({
    case_id: c.id,
    org_id: c.org_id,
    kind: partner.is_flag_only ? 'flagged' : 'auto-routed',
    payload: {
      partner_id: partner.id,
      partner_name: partner.name,
      partner_kind: partnerKind,
      flag_only: partner.is_flag_only,
    },
  });

  return json({
    ok: true, routed: !partner.is_flag_only,
    flagged: partner.is_flag_only, partner: partner.name,
  });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
