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

export async function getCaseTimeline(caseId: string) {
  const { data, error } = await supabase
    .from('case_events')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCaseTreatments(caseId: string) {
  const { data, error } = await supabase
    .from('treatments')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at');
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

/**
 * Public anonymous report — goes through the submit-anonymous-report Edge
 * Function, which adds Turnstile CAPTCHA verification + per-IP rate limiting.
 * Used by the web /:orgSlug/r flow. Mobile uses direct insert (see app-mobile
 * queries) gated by app-install friction.
 */
export async function submitAnonymousReport(input: {
  org_slug: string;
  kind: 'bird' | 'animal' | 'wildlife';
  problem: 'injured' | 'stuck' | 'orphaned' | 'cruelty';
  urgency: 'critical' | 'moderate' | 'low';
  area?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  species_freetext?: string;
  threat_summary?: string;
  turnstile_token?: string;
}): Promise<{ case_id: string; short_id: string }> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-anonymous-report`;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(body.message ?? body.error ?? `Submit failed (${res.status})`);
  }
  return await res.json();
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
  const { data, error } = await supabase
    .from('cases')
    .select('status, cost_inr, received_at, released_at')
    .eq('org_id', orgId);
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

export async function inviteMember(orgId: string, phone: string, role: string, displayName?: string) {
  const { error: otpErr } = await supabase.auth.signInWithOtp({ phone });
  if (otpErr) throw otpErr;
  const { error } = await supabase.from('pending_invites').insert({
    org_id: orgId,
    phone_e164: phone,
    role,
    display_name: displayName ?? null,
  });
  if (error && error.code !== '42P01') throw error;
  return { ok: true };
}

export async function listPendingInvites(orgId: string) {
  const { data, error } = await supabase
    .from('pending_invites')
    .select('*')
    .eq('org_id', orgId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false });
  if (error && error.code !== '42P01') throw error;
  return data ?? [];
}

export async function updateMemberRole(orgId: string, userId: string, newRole: string) {
  const { error } = await supabase
    .from('org_members')
    .update({ role: newRole })
    .eq('org_id', orgId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function removeMember(orgId: string, userId: string) {
  const { error } = await supabase
    .from('org_members')
    .delete()
    .eq('org_id', orgId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function cancelPendingInvite(orgId: string, inviteId: string) {
  const { error } = await supabase
    .from('pending_invites')
    .delete()
    .eq('org_id', orgId)
    .eq('id', inviteId);
  if (error && error.code !== '42P01') throw error;
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
  const { data, error } = await supabase
    .from('active_cases_per_area')
    .select('*')
    .eq('org_id', orgId)
    .order('active_count', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/* ============ FESTIVALS ============ */

export async function listFestivalAlerts() {
  const { data, error } = await supabase
    .from('festival_alerts')
    .select('*')
    .order('starts_on');
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

/* ============ SHIFTS ============ */

export async function listActiveShifts(orgId: string) {
  const { data, error } = await supabase
    .from('shifts')
    .select('*, profile:profiles(id, display_name, phone_e164)')
    .eq('org_id', orgId)
    .is('ends_at', null)
    .order('starts_at', { ascending: false });
  if (error && error.code !== '42P01') throw error;
  return data ?? [];
}

export async function listMyShiftsWeek(orgId: string, userId: string) {
  const since = new Date(); since.setDate(since.getDate() - 7);
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .gte('starts_at', since.toISOString())
    .order('starts_at', { ascending: false });
  if (error && error.code !== '42P01') throw error;
  return data ?? [];
}

export async function listOrgShiftsWeek(orgId: string) {
  const since = new Date(); since.setDate(since.getDate() - 7);
  const { data, error } = await supabase
    .from('shifts')
    .select('*, profile:profiles(id, display_name)')
    .eq('org_id', orgId)
    .gte('starts_at', since.toISOString())
    .order('starts_at', { ascending: false });
  if (error && error.code !== '42P01') throw error;
  return data ?? [];
}

export async function startShift(orgId: string, areas?: string[], plannedEnd?: string, notes?: string) {
  const { data, error } = await supabase.rpc('start_shift', {
    p_org_id: orgId,
    p_area_focus: areas ?? null,
    p_planned_end: plannedEnd ?? null,
    p_notes: notes ?? null,
  });
  if (error) throw error;
  return data;
}

export async function endShift(orgId: string) {
  const { data, error } = await supabase.rpc('end_shift', { p_org_id: orgId });
  if (error) throw error;
  return data;
}

/* ============ CASE COMMENTS ============ */

export async function listCaseComments(caseId: string) {
  const { data, error } = await supabase
    .from('case_comments')
    .select('*, author:profiles(id, display_name)')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true });
  if (error && error.code !== '42P01') throw error;
  return data ?? [];
}

export async function addCaseComment(orgId: string, caseId: string, body: string) {
  const { error } = await supabase
    .from('case_comments')
    .insert({ org_id: orgId, case_id: caseId, body, author_id: (await supabase.auth.getUser()).data.user!.id });
  if (error) throw error;
}

export async function editCaseComment(commentId: string, body: string) {
  const { error } = await supabase.from('case_comments').update({ body }).eq('id', commentId);
  if (error) throw error;
}

export async function deleteCaseComment(commentId: string) {
  const { error } = await supabase.from('case_comments').delete().eq('id', commentId);
  if (error) throw error;
}

/* ============ MEMBER METRICS ============ */

export async function listMemberMetrics(orgId: string) {
  const { data, error } = await supabase
    .from('member_metrics')
    .select('*')
    .eq('org_id', orgId);
  if (error && error.code !== '42P01') throw error;
  return data ?? [];
}

export async function getMemberDetail(orgId: string, userId: string) {
  const [member, metrics, casesRes, shiftsRes] = await Promise.all([
    supabase
      .from('org_members')
      .select('*, profile:profiles(id, display_name, phone_e164, email)')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.from('member_metrics').select('*').eq('org_id', orgId).eq('user_id', userId).maybeSingle(),
    supabase.from('cases_with_species').select('id, short_id, status, species_name, species_freetext, kind, received_at, area')
      .eq('org_id', orgId).eq('assigned_to', userId).order('received_at', { ascending: false }).limit(20),
    supabase.from('shifts').select('*').eq('org_id', orgId).eq('user_id', userId).order('starts_at', { ascending: false }).limit(10),
  ]);
  if (member.error) throw member.error;
  return {
    member: member.data,
    metrics: metrics.data,
    cases: casesRes.data ?? [],
    shifts: shiftsRes.data ?? [],
  };
}

export async function updateMemberServiceAreas(orgId: string, userId: string, areas: string[]) {
  const { error } = await supabase
    .from('org_members')
    .update({ service_areas: areas })
    .eq('org_id', orgId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateMemberDispatchPriority(orgId: string, userId: string, priority: number) {
  const { error } = await supabase
    .from('org_members')
    .update({ dispatch_priority: priority })
    .eq('org_id', orgId)
    .eq('user_id', userId);
  if (error) throw error;
}

/* ============ DISPATCH SUGGESTIONS ============ */

export async function suggestVolunteers(orgId: string, area?: string | null, limit = 10) {
  const { data, error } = await supabase.rpc('suggest_volunteers', {
    p_org_id: orgId,
    p_area: area ?? null,
    p_limit: limit,
  });
  if (error && error.code !== '42883') throw error;
  return data ?? [];
}

/* ============ ADMIN DASHBOARD ============ */

export async function adminDashboard(orgId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fortnightAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const ignoreMissing = (e: any) =>
    e && e.code !== '42P01' && e.code !== '42883' ? Promise.reject(e) : null;

  const [
    paidThisMonth, paidPrevMonth, recurring, sponsorships, allPaid,
    receiptsAgg, products,
    members, pendingInvites, activeShifts, metrics,
    completions, modulesRes,
    releasedThisMonth, releasedAll, recognitionOptIns,
    auditAgg, lastEvent,
  ] = await Promise.all([
    supabase.from('donations').select('amount_inr', { count: 'exact' })
      .eq('org_id', orgId).eq('status', 'paid').gte('paid_at', monthStart.toISOString()),
    supabase.from('donations').select('amount_inr', { count: 'exact' })
      .eq('org_id', orgId).eq('status', 'paid')
      .gte('paid_at', prevMonthStart.toISOString())
      .lt('paid_at', monthStart.toISOString()),
    supabase.from('donations').select('razorpay_sub')
      .eq('org_id', orgId).not('razorpay_sub', 'is', null),
    supabase.from('donations').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'paid').not('case_id', 'is', null),
    supabase.from('donations').select('amount_inr')
      .eq('org_id', orgId).eq('status', 'paid'),
    supabase.from('donations').select('receipt_no, status, receipt_email_status')
      .eq('org_id', orgId).eq('status', 'paid'),
    supabase.from('donations')
      .select('amount_inr, product:donation_products(label, emoji)')
      .eq('org_id', orgId).eq('status', 'paid'),

    supabase.from('org_members').select('user_id', { count: 'exact', head: true })
      .eq('org_id', orgId),
    supabase.from('pending_invites').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).is('accepted_at', null),
    supabase.from('shifts').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).is('ends_at', null),
    supabase.from('member_metrics').select('user_id, accept_rate, last_active_at, avg_response_seconds')
      .eq('org_id', orgId),

    supabase.from('training_completions').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId),
    supabase.from('training_modules').select('id', { count: 'exact', head: true })
      .or(`org_id.eq.${orgId},org_id.is.null`),

    supabase.from('cases').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'released').gte('released_at', monthStart.toISOString()),
    supabase.from('cases').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'released'),
    supabase.from('donors').select('id', { count: 'exact', head: true })
      .eq('display_consent', true),

    supabase.from('case_events').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).gte('created_at', weekAgo.toISOString()),
    supabase.from('case_events').select('created_at, kind')
      .eq('org_id', orgId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  for (const r of [paidThisMonth, paidPrevMonth, recurring, sponsorships, allPaid, receiptsAgg,
                   products, members, pendingInvites, activeShifts, metrics, completions,
                   modulesRes, releasedThisMonth, releasedAll, recognitionOptIns,
                   auditAgg, lastEvent]) {
    await ignoreMissing((r as any).error);
  }

  const paidMtd      = sumAmount(paidThisMonth.data);
  const paidPrev     = sumAmount(paidPrevMonth.data);
  const totalPaid    = sumAmount(allPaid.data);
  const paidCount    = allPaid.data?.length ?? 0;
  const avgGiftInr   = paidCount > 0 ? Math.round(totalPaid / paidCount) : 0;
  const recurringCount = new Set((recurring.data ?? []).map((r: any) => r.razorpay_sub).filter(Boolean)).size;

  const receiptsIssued = (receiptsAgg.data ?? []).filter((d: any) => d.receipt_no).length;
  const receiptsPending = (receiptsAgg.data ?? []).filter((d: any) => !d.receipt_no).length;
  const receiptsEmailFailed = (receiptsAgg.data ?? []).filter(
    (d: any) => d.receipt_no && d.receipt_email_status === 'failed',
  ).length;

  const productTotals = new Map<string, { label: string; emoji: string | null; total: number; count: number }>();
  for (const d of (products.data ?? []) as any[]) {
    const p = d.product;
    if (!p) continue;
    const cur = productTotals.get(p.label) ?? { label: p.label, emoji: p.emoji ?? null, total: 0, count: 0 };
    cur.total += d.amount_inr ?? 0;
    cur.count += 1;
    productTotals.set(p.label, cur);
  }
  const topProduct = Array.from(productTotals.values()).sort((a, b) => b.total - a.total)[0] ?? null;

  const memberRows = metrics.data ?? [];
  const inactive14 = memberRows.filter(
    (m: any) => !m.last_active_at || new Date(m.last_active_at) < fortnightAgo,
  ).length;
  const acceptRates = memberRows.map((m: any) => m.accept_rate).filter((r: any) => r != null) as number[];
  const avgAcceptRate = acceptRates.length > 0
    ? Math.round(acceptRates.reduce((s, r) => s + r, 0) / acceptRates.length * 10) / 10
    : null;
  const avgResponseSeconds = (() => {
    const xs = memberRows.map((m: any) => m.avg_response_seconds).filter((x: any) => x != null) as number[];
    if (xs.length === 0) return null;
    return Math.round(xs.reduce((s, x) => s + x, 0) / xs.length);
  })();

  const memberCount   = members.count ?? 0;
  const moduleCount   = modulesRes.count ?? 0;
  const completionCount = completions.count ?? 0;
  const expected      = memberCount * moduleCount;
  const trainingCompletionPct = expected > 0 ? Math.min(100, Math.round(completionCount / expected * 100)) : 0;

  return {
    money: {
      paidMtd,
      paidPrev,
      momChangePct: paidPrev > 0 ? Math.round((paidMtd - paidPrev) / paidPrev * 100) : null,
      recurringCount,
      sponsorships: sponsorships.count ?? 0,
      avgGiftInr,
      topProduct,
      receiptsIssued,
      receiptsPending,
      receiptsEmailFailed,
      totalPaid,
      paidCount,
    },
    team: {
      total: memberCount,
      pendingInvites: pendingInvites.count ?? 0,
      onShiftNow: activeShifts.count ?? 0,
      inactiveDays14: inactive14,
      trainingCompletionPct,
      avgAcceptRate,
      avgResponseSeconds,
    },
    stories: {
      releasedMtd: releasedThisMonth.count ?? 0,
      cumulativeReleased: releasedAll.count ?? 0,
      recognitionOptIns: recognitionOptIns.count ?? 0,
    },
    compliance: {
      auditEventsThisWeek: auditAgg.count ?? 0,
      lastAuditEventAt: lastEvent.data?.created_at ?? null,
      lastAuditEventKind: lastEvent.data?.kind ?? null,
      latestImpactPosterMonth: null as string | null,
    },
  };
}

function sumAmount(rows: { amount_inr?: number | null }[] | null | undefined): number {
  return (rows ?? []).reduce((s, r) => s + (r.amount_inr ?? 0), 0);
}
