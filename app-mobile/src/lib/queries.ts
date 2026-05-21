// Mirror of the web app's query helpers, scoped to what the reporter app needs.
import { supabase } from './supabase';

export interface Organization {
  id: string; slug: string; name: string; public_name: string | null;
  tagline: string | null; helpline_e164: string | null; brand_primary: string | null;
  founded_year: number | null;
}

export async function getOrgBySlug(slug: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, slug, name, public_name, tagline, helpline_e164, brand_primary, founded_year')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listSpecies() {
  const { data, error } = await supabase.from('species').select('*').order('common_name');
  if (error) throw error;
  return data ?? [];
}

export async function listFestivalAlerts() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('festival_alerts')
    .select('*')
    .order('starts_on');
  if (error) throw error;
  return (data ?? []).filter((f: any) =>
    (!f.starts_on || f.starts_on <= today) && (!f.ends_on || f.ends_on >= today)
  );
}

export async function createReport(input: {
  org_id: string;
  kind: 'bird' | 'animal' | 'wildlife';
  problem: 'injured' | 'stuck' | 'orphaned' | 'cruelty';
  urgency: 'critical' | 'moderate' | 'low';
  species_freetext?: string;
  threat_summary?: string;
  area?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  reporter_anon?: boolean;
}) {
  const { data, error } = await supabase
    .from('cases')
    .insert({
      ...input,
      status: input.urgency === 'critical' ? 'critical' : 'in-rescue',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCaseStatus(caseId: string) {
  const { data, error } = await supabase
    .from('cases_with_species')
    .select('id, short_id, status, species_name, species_emoji, threat_summary, area, received_at, rescued_at, released_at, first_photo_url')
    .eq('id', caseId)
    .single();
  if (error) throw error;
  return data;
}

export async function listMyReports(userId: string) {
  const { data, error } = await supabase
    .from('cases_with_species')
    .select('id, short_id, status, species_name, species_emoji, threat_summary, area, received_at, first_photo_url')
    .eq('reporter_id', userId)
    .order('received_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function uploadReportPhoto(orgSlug: string, caseId: string, uri: string) {
  // Upload the photo to Supabase Storage, then link its public URL back to the
  // cases row so the donor portal / impact poster / team list can render a
  // thumbnail without listing storage.
  const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase();
  const filename = `${orgSlug}/${caseId}/${Date.now()}.${ext}`;
  const res = await fetch(uri);
  const blob = await res.blob();

  const { data, error } = await supabase.storage
    .from('case-photos')
    .upload(filename, blob, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: false });
  if (error) throw error;

  // Best-effort: write the public URL onto the case. Falls through silently if
  // the column doesn't exist yet (pre-migration 0007) so we never block the
  // submit on this side-effect.
  try {
    const { data: pub } = supabase.storage.from('case-photos').getPublicUrl(data.path);
    if (pub?.publicUrl) {
      await supabase
        .from('cases')
        .update({ first_photo_url: pub.publicUrl })
        .eq('id', caseId)
        .is('first_photo_url', null);
    }
  } catch (e) {
    console.warn('first_photo_url writeback failed', e);
  }

  return data.path;
}
