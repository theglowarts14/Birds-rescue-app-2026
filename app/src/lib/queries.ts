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
  const { data, error } = await supabase.from('cases_with_species').select('*').eq('id', caseId).single();
  if (error) throw error;
  return data as CaseWithSpecies;
}

export async function getCaseTimeline(caseId: string) {
  const { data, error } = await supabase.from('case_events').select('*').eq('case_id', caseId).order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCaseTreatments(caseId: string) {
  const { data, error } = await supabase.from('treatments').select('*').eq('case_id', caseId).order('created_at');
  if (error) throw error;
  return data ?? [];
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

export async function updateCaseStatus(caseId: string, status: string) {
  const { error } = await supabase.from('cases').update({ status }).eq('id', caseId);
  if (error) throw error;
}

/* ============ INCOMING ============ */

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
  const { data, error } = await supabase.from('cases').select('status, cost_inr, received_at, released_at').eq('org_id', orgId);
  if (error) throw error;
  const rows = data ?? [];
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  return {
    active:   rows.filter((r) => r.status !== 'released' && r.status !== 'closed-unrescued').length,
    critical: rows.filter((r) => r.status === 'critical').length,
    inCare:   rows.filter((r) => r.status === 'in-rescue' || r.status === 'recovering').length,
    released: rows.filter((r) => r.released_at && new Date(r.released_at) >= monthStart).length,
    spendMTD: rows.filter((r) => new Date(r.received_at) >= monthStart).reduce((s, r: any) => s + (r.cost_inr || 0), 0),
    total:    rows.length,
  };
}

/* ============ ROSTER ============ */

export async function listOrgMembers(orgId: string) {
  const { data, error } = await supabase
    .from('org_members')
    .select('*, profile:profiles(id, display_name, phone_e164, email, preferred_lang)')
    .eq('org_id', orgId);
  if (error) throw error;
  return data ?? [];
}

export async function inviteMember(_orgId: string, phone: string, _role: string) {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
  return { ok: true };
}

/* ============ PARTNERS / CLINICS / FOSTERS ============ */

export async function listPartners(orgId: string) {
  const { data, error } = await supabase.from('partners').select('*').eq('org_id', orgId).order('name');
  if (error) throw error;
  return data ?? [];
}

export async function listClinics(orgId: string) {
  const { data, error } = await supabase.from('vet_clinics').select('*').eq('org_id', orgId).order('is_24x7', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listFosters(orgId: string) {
  const { data, error } = await supabase
    .from('fosters')
    .select('*, profile:profiles(display_name, phone_e164)')
    .eq('org_id', orgId)
    .eq('is_active', true);
  if (error) throw error;
  return data ?? [];
}

/* ============ INVENTORY ============ */

export async function listInventory(orgId: string) {
  const { data, error } = await supabase.from('inventory').select('*').eq('org_id', orgId).order('item');
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ ...r, low: r.stock <= r.low_threshold }));
}

/* ============ TRAINING ============ */

export async function listTrainingModules(orgId?: string) {
  const q = supabase.from('training_modules').select('*').order('level');
  const { data, error } = await (orgId ? q.or(`org_id.eq.${orgId},org_id.is.null`) : q.is('org_id', null));
  if (error) throw error;
  return data ?? [];
}

export async function listMyCompletions(userId: string) {
  const { data, error } = await supabase.from('training_completions').select('*').eq('user_id', userId);
  if (error) throw error;
  return data ?? [];
}

/* ============ AUDIT / EVENTS ============ */

export async function listAuditFeed(orgId: string, limit = 50) {
  const { data, error } = await supabase
    .from('case_events')
    .select('*, case:cases(short_id, threat_summary, area), actor:profiles(display_name)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/* ============ DONATIONS ============ */

export async function listDonations(orgId: string, opts?: { status?: string }) {
  let q = supabase
    .from('donations')
    .select('*, donor:donors(name, display_consent), product:donation_products(label, emoji)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (opts?.status) q = q.eq('status', opts.status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function listReleases(orgId: string) {
  const { data, error } = await supabase
    .from('cases_with_species')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'released')
    .order('released_at', { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data ?? []) as CaseWithSpecies[];
}

export async function listRecognitionWall(orgId: string) {
  const { data, error } = await supabase
    .from('donations')
    .select('amount_inr, donor:donors!inner(name, display_consent)')
    .eq('org_id', orgId)
    .eq('status', 'paid');
  if (error) throw error;
  return (data ?? []).filter((d: any) => d.donor?.display_consent);
}

/* ============ AREAS / HEATMAP ============ */

export async function listAreaDensity(orgId: string) {
  const { data, error } = await supabase.from('active_cases_per_area').select('*').eq('org_id', orgId).order('active_count', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/* ============ FESTIVALS ============ */

export async function listFestivalAlerts() {
  const { data, error } = await supabase.from('festival_alerts').select('*').order('starts_on');
  if (error) throw error;
  return data ?? [];
}

/* ============ ORG SETTINGS ============ */

export async function updateOrg(orgId: string, fields: Record<string, any>) {
  const { error } = await supabase.from('organizations').update(fields).eq('id', orgId);
  if (error) throw error;
}

/* ============ DONATION PRODUCTS ============ */

export async function listDonationProducts(orgId: string) {
  const { data, error } = await supabase
    .from('donation_products')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('amount_inr');
  if (error) throw error;
  return data ?? [];
}
