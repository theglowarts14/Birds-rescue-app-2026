// Supabase Realtime subscriptions, scoped per-org. Three hooks for the team
// surface and one for the donor-facing tracker.
//
// All hooks invalidate the relevant React Query keys on change. New cases also
// emit a "new-case" event that the RealtimeToast provider listens for to show
// the incoming-case banner.
//
// Realtime channels: one per (org, table) to keep server-side fan-out tight.
// Channels auto-clean on unmount.

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';

const NEW_CASE_EVENT = 'karuna:new-case';

export interface NewCasePayload {
  id: string;
  short_id: string;
  org_id: string;
  status: string;
  kind: string;
  species_freetext: string | null;
  threat_summary: string | null;
  area: string | null;
  urgency: string;
  received_at: string;
}

export function onNewCase(handler: (c: NewCasePayload) => void): () => void {
  const fn = (e: Event) => handler((e as CustomEvent<NewCasePayload>).detail);
  window.addEventListener(NEW_CASE_EVENT, fn);
  return () => window.removeEventListener(NEW_CASE_EVENT, fn);
}

function emitNewCase(c: NewCasePayload) {
  window.dispatchEvent(new CustomEvent<NewCasePayload>(NEW_CASE_EVENT, { detail: c }));
}

export function useRealtimeCases(orgId: string | undefined): void {
  const qc = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!orgId) return;
    const ch = supabase
      .channel(`cases:${orgId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cases', filter: `org_id=eq.${orgId}` },
        (payload: RealtimePostgresChangesPayload<NewCasePayload>) => {
          if (payload.new) emitNewCase(payload.new as NewCasePayload);
          qc.invalidateQueries({ queryKey: ['cases', orgId] });
          qc.invalidateQueries({ queryKey: ['critical', orgId] });
          qc.invalidateQueries({ queryKey: ['stats', orgId] });
          qc.invalidateQueries({ queryKey: ['admin-dashboard', orgId] });
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cases', filter: `org_id=eq.${orgId}` },
        (payload) => {
          const id = (payload.new as { id?: string })?.id;
          if (id) qc.invalidateQueries({ queryKey: ['case', id] });
          qc.invalidateQueries({ queryKey: ['cases', orgId] });
          qc.invalidateQueries({ queryKey: ['critical', orgId] });
          qc.invalidateQueries({ queryKey: ['stats', orgId] });
        },
      )
      .subscribe();
    channelRef.current = ch;

    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [orgId, qc]);
}

export function useRealtimeCase(caseId: string | undefined): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!caseId) return;
    const ch = supabase
      .channel(`case:${caseId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'cases', filter: `id=eq.${caseId}` },
        () => qc.invalidateQueries({ queryKey: ['case', caseId] }))
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'case_events', filter: `case_id=eq.${caseId}` },
        () => qc.invalidateQueries({ queryKey: ['case-timeline', caseId] }))
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'case_comments', filter: `case_id=eq.${caseId}` },
        () => qc.invalidateQueries({ queryKey: ['case-comments', caseId] }))
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'treatments', filter: `case_id=eq.${caseId}` },
        () => qc.invalidateQueries({ queryKey: ['case-treatments', caseId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [caseId, qc]);
}

export function useRealtimeShifts(orgId: string | undefined): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!orgId) return;
    const ch = supabase
      .channel(`shifts:${orgId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'shifts', filter: `org_id=eq.${orgId}` },
        () => {
          qc.invalidateQueries({ queryKey: ['active-shifts', orgId] });
          qc.invalidateQueries({ queryKey: ['week-shifts', orgId] });
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId, qc]);
}

export function useRealtimeDonations(orgId: string | undefined): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!orgId) return;
    const ch = supabase
      .channel(`donations:${orgId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'donations', filter: `org_id=eq.${orgId}` },
        () => {
          qc.invalidateQueries({ queryKey: ['admin-dashboard', orgId] });
          qc.invalidateQueries({ queryKey: ['donations', orgId] });
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId, qc]);
}
