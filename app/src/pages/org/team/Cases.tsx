import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useOrg } from '../../../lib/org';
import { listCases } from '../../../lib/queries';
import { Search, ChevronRight, MapPin } from 'lucide-react';
import type { CaseStatus } from '../../../lib/database.types';
import { PageHeader, LoadingRow, ErrorRow, EmptyState } from '../../../components/ui';

const STATUS_LABELS: Record<CaseStatus | 'all', string> = {
  all: 'All',
  critical: 'Critical',
  'in-rescue': 'In rescue',
  recovering: 'Recovering',
  released: 'Released',
  'closed-unrescued': 'Closed',
};

const STATUS_COLOR: Record<string, string> = {
  critical: 'bg-rust/15 text-rust',
  'in-rescue': 'bg-amber/15 text-amber',
  recovering: 'bg-moss/15 text-moss',
  released: 'bg-sky/15 text-sky',
};

export default function Cases() {
  const { org } = useOrg();
  const { orgSlug } = useParams();
  const [status, setStatus] = useState<'all' | CaseStatus>('all');
  const [q, setQ] = useState('');

  const cases = useQuery({
    queryKey: ['cases', org?.id, status, q],
    queryFn: () => listCases(org!.id, { status, q }),
    enabled: !!org?.id,
  });

  return (
    <>
      <PageHeader kicker="Active board" title="Today's cases," accent="by urgency." />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={14} className="absolute left-3 top-3 text-ink-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search case, species, area…" className="w-full pl-9 pr-3 py-2 bg-cream rounded-xl border border-black/10 text-sm" />
        </div>
        <div className="flex gap-1 p-1 bg-cream rounded-full border border-black/10">
          {(['all','critical','in-rescue','recovering','released'] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${status === s ? 'bg-ink text-paper' : 'text-ink-soft'}`}>{STATUS_LABELS[s]}</button>
          ))}
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="hidden md:grid grid-cols-[110px_1fr_1.4fr_1fr_110px_40px] px-5 py-3 bg-cream text-[10px] font-mono tracking-widest uppercase text-ink-muted border-b border-black/10">
          <div>Case</div><div>Species</div><div>Threat · location</div><div>Volunteer</div><div>Status</div><div></div>
        </div>
        {cases.isLoading && <LoadingRow />}
        {cases.isError && <ErrorRow err={cases.error} />}
        {!cases.isLoading && cases.data?.length === 0 && <EmptyState title="No cases match these filters." />}
        {cases.data?.map((c) => (
          <Link
            key={c.id}
            to={`/${orgSlug}/team/cases/${c.id}`}
            className="grid grid-cols-[110px_1fr_1.4fr_1fr_110px_40px] gap-2 items-center px-5 py-3 border-b border-black/10 w-full text-left hover:bg-cream/60"
          >
            <div className="font-mono text-xs text-ink-soft">{c.short_id}</div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl">{c.species_emoji ?? '🪶'}</span>
              <div className="min-w-0">
                <div className="display font-medium truncate">{c.species_name ?? c.species_freetext ?? c.kind}</div>
                <div className="text-[11px] text-ink-muted">{new Date(c.received_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</div>
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-sm truncate">{c.threat_summary}</div>
              <div className="text-[11px] text-ink-muted truncate"><MapPin size={10} className="inline -mt-0.5 mr-1" />{c.area}</div>
            </div>
            <div className="text-sm text-ink-soft truncate">{c.assigned_to ? 'Assigned' : 'Unassigned'}</div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${STATUS_COLOR[c.status] ?? 'bg-cream text-ink-soft'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {STATUS_LABELS[c.status]}
            </span>
            <ChevronRight size={16} className="text-ink-muted" />
          </Link>
        ))}
      </div>
    </>
  );
}
