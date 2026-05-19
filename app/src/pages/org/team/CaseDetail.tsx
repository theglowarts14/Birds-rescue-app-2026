import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCase, getCaseTimeline, getCaseTreatments, updateCaseStatus,
  suggestVolunteers,
} from '../../../lib/queries';
import { ArrowLeft, MapPin, Clock, Stethoscope, Camera, Phone, Radio, Send } from 'lucide-react';
import { LoadingRow, ErrorRow } from '../../../components/ui';
import { CaseComments } from '../../../components/CaseComments';
import type { CaseStatus } from '../../../lib/database.types';

const NEXT: Record<CaseStatus, CaseStatus | null> = {
  critical: 'in-rescue',
  'in-rescue': 'recovering',
  recovering: 'released',
  released: null,
  'closed-unrescued': null,
};

export default function CaseDetail() {
  const { caseId, orgSlug } = useParams();
  const qc = useQueryClient();

  const c = useQuery({ queryKey: ['case', caseId], queryFn: () => getCase(caseId!), enabled: !!caseId });
  const t = useQuery({ queryKey: ['case-timeline', caseId], queryFn: () => getCaseTimeline(caseId!), enabled: !!caseId });
  const treat = useQuery({ queryKey: ['case-treatments', caseId], queryFn: () => getCaseTreatments(caseId!), enabled: !!caseId });
  const suggest = useQuery({
    queryKey: ['suggest', caseId, c.data?.area, c.data?.org_id],
    queryFn: () => suggestVolunteers(c.data!.org_id, c.data!.area ?? null, 5),
    enabled: !!c.data && c.data.status !== 'released' && c.data.status !== 'closed-unrescued',
  });

  const advance = useMutation({
    mutationFn: async (status: string) => updateCaseStatus(caseId!, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['case', caseId] }),
  });

  if (c.isLoading) return <LoadingRow />;
  if (c.isError) return <ErrorRow err={c.error} />;
  if (!c.data) return null;
  const next = NEXT[c.data.status];

  return (
    <>
      <Link to={`/${orgSlug}/team/cases`} className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink mb-4">
        <ArrowLeft size={14} /> All cases
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-24 lg:pb-0">
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="text-4xl sm:text-5xl">{c.data.species_emoji ?? '🪶'}</span>
                <div>
                  <div className="kicker">{c.data.short_id}</div>
                  <h1 className="display text-2xl sm:text-3xl mt-1">{c.data.species_name ?? c.data.species_freetext ?? c.data.kind}</h1>
                  <p className="text-ink-soft mt-2 text-sm sm:text-base">{c.data.threat_summary}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-mono tracking-widest uppercase ${
                c.data.status === 'critical' ? 'bg-rust/15 text-rust' :
                c.data.status === 'released' ? 'bg-sky/15 text-sky' :
                c.data.status === 'recovering' ? 'bg-moss/15 text-moss' : 'bg-amber/15 text-amber'
              }`}>{c.data.status}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-5 text-sm">
              <Meta icon={<MapPin size={12} />} label="Area" value={c.data.area ?? '—'} />
              <Meta icon={<Clock size={12} />} label="Received" value={new Date(c.data.received_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })} />
              <Meta icon={<Stethoscope size={12} />} label="Assigned" value={c.data.assigned_to ? 'In team' : 'Unassigned'} />
              <Meta icon={<Camera size={12} />} label="Cost" value={`₹${(c.data.cost_inr || 0).toLocaleString('en-IN')}`} />
            </div>
            {next && (
              <button
                onClick={() => advance.mutate(next)}
                disabled={advance.isPending}
                className="hidden lg:inline-flex btn-primary mt-5"
              >
                Mark as {next}
              </button>
            )}
          </div>

          <CaseComments orgId={c.data.org_id} caseId={c.data.id} />

          <div className="card">
            <h3 className="display text-xl mb-3">Treatment log</h3>
            {treat.isLoading && <LoadingRow />}
            {!treat.isLoading && (treat.data?.length ?? 0) === 0 && (
              <p className="text-sm text-ink-soft italic">No treatment entries yet.</p>
            )}
            <ul className="space-y-3">
              {treat.data?.map((row: any) => (
                <li key={row.id} className="grid grid-cols-[70px_1fr] sm:grid-cols-[80px_1fr] gap-3 items-start pb-3 border-b border-black/5 last:border-0">
                  <div className="font-mono text-[11px] text-ink-muted">{row.day_label ?? new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                  <div>
                    <div className="text-sm">{row.note}</div>
                    {row.weight_grams && <div className="text-[11px] text-ink-muted mt-0.5">Weight {row.weight_grams}g</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-5">
          {(suggest.data?.length ?? 0) > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Send size={14} className="text-rust" />
                <h3 className="display text-lg">Suggested <em className="italic text-rust">volunteers</em></h3>
              </div>
              {c.data.area && (
                <p className="text-[11px] text-ink-soft mb-3">
                  Ranked by on-shift, area match for <span className="font-mono">{c.data.area}</span>, then accept rate.
                </p>
              )}
              <ul className="space-y-2">
                {suggest.data!.map((v: any) => (
                  <li key={v.user_id} className="grid grid-cols-[1fr_auto] gap-2 items-center p-2 bg-cream/40 rounded-xl">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {v.on_shift && <Radio size={11} className="text-moss shrink-0" />}
                        <span className="display text-sm truncate">{v.display_name ?? 'Volunteer'}</span>
                      </div>
                      <div className="text-[10px] text-ink-soft font-mono mt-0.5 flex flex-wrap gap-2">
                        <span>{v.role}</span>
                        {v.area_match && <span className="text-sky">✓ area</span>}
                        {v.accept_rate != null && (
                          <span className={v.accept_rate >= 80 ? 'text-moss' : v.accept_rate >= 50 ? 'text-amber' : 'text-rust'}>
                            {v.accept_rate}% accept
                          </span>
                        )}
                      </div>
                    </div>
                    <a href={v.phone_e164 ? `tel:${v.phone_e164}` : '#'} className="btn-ghost !py-1 !px-2.5 !text-[11px]">
                      Call
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <div className="kicker mb-3">Timeline</div>
            {t.isLoading && <LoadingRow />}
            <ul className="space-y-3">
              {t.data?.map((e: any) => (
                <li key={e.id} className="flex gap-3 items-start">
                  <div className="w-2 h-2 mt-2 rounded-full bg-rust shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium capitalize">{e.kind.replace('-', ' ')}</div>
                    <div className="text-[11px] text-ink-muted">{new Date(e.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</div>
                    {e.payload?.to && <div className="text-[11px] text-ink-soft mt-1">→ {e.payload.to}</div>}
                  </div>
                </li>
              ))}
              {!t.isLoading && (t.data?.length ?? 0) === 0 && <li className="text-sm text-ink-muted italic">No events yet.</li>}
            </ul>
          </div>
        </div>
      </div>

      {next && (
        <div
          className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-paper border-t border-black/10 px-4 py-3 flex gap-2"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)', marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <a href="tel:" className="btn-ghost shrink-0 !px-3"><Phone size={16} /></a>
          <button
            onClick={() => advance.mutate(next)}
            disabled={advance.isPending}
            className="btn-primary flex-1 justify-center"
          >
            {advance.isPending ? 'Updating…' : `Mark as ${next}`}
          </button>
        </div>
      )}
    </>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-cream/60 rounded-xl p-2.5 sm:p-3">
      <div className="kicker flex items-center gap-1">{icon} {label}</div>
      <div className="text-xs sm:text-sm mt-1 truncate">{value}</div>
    </div>
  );
}
