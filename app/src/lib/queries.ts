import { supabase } from './supabase';
import type { CaseWithSpecies } from './database.types';

/* ============ CASES ============ */

export async function listCases(orgId: string, opts?: { status?: string; q?: string }) {
  let q = supabase
    .from('cases_with_species')
    .select('*')
    .eq('org_id', orgId)
    .order('received_at', { ascending: false })
    .limit(200);
  if (opts?.status && opts.status !== 'all') q = q.eq('status', opts.status);
  if (opts?.q) q = q.or(`threat_summary.ilike.%${opts.q}%,area.ilike.%${opts.q}%,species_freetext.ilike.%${opts.q}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as CaseWithSpecies[];
}

export async function getCase(caseId: string) {
  const { data, error } = await supabase
    .from('cases_with_species')
    .select('*')
    .eq('id', caseId)
    .single();
  if (error) throw error;
  return data as CaseWithSpecies;
}

export async function createCase(input: {
  org_id: string;
  kind: 'bird' | 'animal' | 'wildlife';
  problem: 'injured' | 'stuck' | 'orphaned' | 'cruelty';
  urgency: 'critical' | 'moderate' | 'low';
  species_freetext?: string;
  threat_summary?: string;
  location_text?: string;
  area?: string;
  notes?: string;
  reporter_anon?: boolean;
}) {
  const { data, error } = await supabase
    .from('cases')
    .insert({ ...input, status: input.urgency === 'critical' ? 'critical' : 'in-rescue' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ============ INCOMING TRIAGE QUEUE ============ */

export async function listIncoming(orgId: string) {
  const { data, error } = await supabase
    .from('incoming_queue')
    .select('*')
    .eq('org_id', orgId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

/* ============ STATS ============ */

export async function dashboardStats(orgId: string) {
  const { data, error } = await supabase
    .from('cases')
    .select('status', { count: 'exact', head: false })
    .eq('org_id', orgId);
  if (error) throw error;
  const rows = data ?? [];
  return {
    active:   rows.filter((r) => r.status !== 'released').length,
    critical: rows.filter((r) => r.status === 'critical').length,
    inCare:   rows.filter((r) => r.status === 'in-rescue' || r.status === 'recovering').length,
    released: rows.filter((r) => r.status === 'released').length,
  };
}

/* ============ ORG MEMBERS / VOLUNTEER ROSTER ============ */

export async function listOrgMembers(orgId: string) {
  const { data, error } = await supabase
    .from('org_members')
    .select('*, profile:profiles(display_name, phone_e164)')
    .eq('org_id', orgId);
  if (error) throw error;
  return data ?? [];
}
