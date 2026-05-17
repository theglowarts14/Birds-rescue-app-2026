import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCase, getCaseTimeline, getCaseTreatments, updateCaseStatus } from '../../../lib/queries';
import { ArrowLeft, MapPin, Clock, Stethoscope, Camera } from 'lucide-react';
import { LoadingRow, ErrorRow } from '../../../components/ui';
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-4">
                <span className="text-5xl">{c.data.species_emoji ?? '🪶'}</span>
                <div>
                  <div className="kicker">{c.data.short_id}</div>
                  <h1 className="display text-3xl mt-1">{c.data.species_name ?? c.data.species_freetext ?? c.data.kind}</h1>
                  <p className="text-ink-soft mt-2">{c.data.threat_summary}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-mono tracking-widest uppercase ${
                c.data.status === 'critical' ? 'bg-rust/15 text-rust' :
                c.data.status === 'released' ? 'bg-sky/15 text-sky' :
                c.data.status === 'recovering' ? 'bg-moss/15 text-moss' : 'bg-amber/15 text-amber'
              }`}>{c.data.status}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 text-sm">
              <Meta icon={<MapPin size={12} />} label="Area" value={c.data.area ?? '—'} />
              <Meta icon={<Clock size={12} />} label="Received" value={new Date(c.data.received_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })} />
              <Meta icon={<Stethoscope size={12} />} label="Assigned" value={c.data.assigned_to ? 'In team' : 'Unassigned'} />
              <Meta icon={<Camera size={12} />} label="Cost so far" value={`₹${(c.data.cost_inr || 0).toLocaleString('en-IN')}`} />
            </div>
            {next && (
              <button onClick={() => advance.mutate(next)} disabled={advance.isPending} className="btn-primary mt-5">
                Mark as {next}
              </button>
            )}
          </div>

          <div className="card">
            <h3 className="display text-xl mb-3">Treatment log</h3>
            {treat.isLoading && <LoadingRow />}
            {!treat.isLoading && (treat.data?.length ?? 0) === 0 && (
              <p className="text-sm text-ink-soft italic">No treatment entries yet.</p>
            )}
            <ul className="space-y-3">
              {treat.data?.map((row: any) => (
                <li key={row.id} className="grid grid-cols-[80px_1fr] gap-3 items-start pb-3 border-b border-black/5 last:border-0">
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
    </>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-cream/60 rounded-xl p-3">
      <div className="kicker flex items-center gap-1">{icon} {label}</div>
      <div className="text-sm mt-1">{value}</div>
    </div>
  );
}
