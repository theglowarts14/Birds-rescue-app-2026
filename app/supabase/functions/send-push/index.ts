// Expo Push for case events. Called from the client or a trigger after a status
// change. Looks up reporter + sponsor push tokens, sends editorial copy.

import { preflight, corsHeaders } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/supabase.ts';

interface Payload { case_id: string; event_kind?: string; to?: string; }

const NARRATIVE: Record<string, { title: string; body: (species: string) => string }> = {
  dispatched: { title: 'A rescuer is on the way',  body: (s) => `Heading to your ${s.toLowerCase()} now.` },
  'en-route': { title: 'On the way',               body: (s) => `Volunteer is en route to your ${s.toLowerCase()}.` },
  rescued:    { title: 'Picked up safely',         body: (s) => `Your ${s.toLowerCase()} is in our hands.` },
  recovering: { title: 'In our care',              body: (s) => `Your ${s.toLowerCase()} is healing.` },
  release:    { title: 'Released. Back to sky.',   body: (s) => `Your ${s.toLowerCase()} is free again.` },
  'status-change': { title: 'Update',              body: (s) => `Your ${s.toLowerCase()}'s status changed.` },
};

Deno.serve(async (req) => {
  const pre = preflight(req); if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const { case_id, event_kind = 'status-change', to }: Payload = await req.json();
  if (!case_id) return json({ error: 'case_id required' }, 400);

  const supa = serviceClient();

  const { data: c } = await supa
    .from('cases_with_species')
    .select('id, short_id, species_name, species_freetext, kind, reporter_id, sponsor_id, status, org_id')
    .eq('id', case_id)
    .single();
  if (!c) return json({ error: 'case not found' }, 404);

  const species = c.species_name ?? c.species_freetext ?? c.kind;
  const narrative = NARRATIVE[event_kind === 'status-change' ? c.status : event_kind] ?? NARRATIVE['status-change'];

  const userIds = new Set<string>();
  if (c.reporter_id) userIds.add(c.reporter_id);
  if (c.sponsor_id) {
    const { data: sp } = await supa.from('donations').select('donor:donors(profile_id)').eq('id', c.sponsor_id).single();
    const pid = (sp?.donor as any)?.profile_id;
    if (pid) userIds.add(pid);
  }
  if (to) userIds.add(to);
  if (userIds.size === 0) return json({ ok: true, sent: 0 });

  const { data: profiles } = await supa
    .from('profiles')
    .select('id, push_token')
    .in('id', [...userIds]);

  const tokens = (profiles ?? [])
    .map((p) => p.push_token)
    .filter((t): t is string => typeof t === 'string' && t.startsWith('ExponentPushToken['));

  if (tokens.length === 0) return json({ ok: true, sent: 0 });

  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default' as const,
    title: narrative.title,
    body: narrative.body(species),
    data: { case_id, short_id: c.short_id },
    priority: c.status === 'critical' ? 'high' : 'normal',
  }));

  const resp = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!resp.ok) {
    return json({ error: 'expo push failed', detail: await resp.text() }, 502);
  }

  return json({ ok: true, sent: tokens.length });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
