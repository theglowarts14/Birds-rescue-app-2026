import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useOrg } from '../../../lib/org';
import { listAuditFeed } from '../../../lib/queries';
import { PageHeader, LoadingRow, EmptyState } from '../../../components/ui';
import { History } from 'lucide-react';

const KIND_COLOR: Record<string, string> = {
  received:        'bg-amber/15 text-amber',
  dispatched:      'bg-rust/15 text-rust',
  'en-route':      'bg-rust/15 text-rust',
  rescued:         'bg-moss/15 text-moss',
  handover:        'bg-sky/15 text-sky',
  treatment:       'bg-sky/15 text-sky',
  'status-change': 'bg-ink/10 text-ink',
  note:            'bg-cream text-ink-soft',
  photo:           'bg-cream text-ink-soft',
  release:         'bg-sky/15 text-sky',
  sponsored:       'bg-amber/15 text-amber',
  'auto-routed':   'bg-cream text-ink-soft',
};

export default function Audit() {
  const { org } = useOrg();
  const { orgSlug } = useParams();
  const q = useQuery({ queryKey: ['audit', org?.id], queryFn: () => listAuditFeed(org!.id, 100), enabled: !!org?.id });

  return (
    <>
      <PageHeader kicker="Append-only log" title="Audit" accent="trail." />

      <p className="text-sm text-ink-soft mb-5 max-w-xl">
        Every status change, every dispatch, every note. Source of truth for funders, regulators, and post-mortems.
      </p>

      {q.isLoading && <LoadingRow />}
      {!q.isLoading && q.data?.length === 0 && <EmptyState icon={<History size={28} />} title="No events yet" />}

      <div className="card !p-0 overflow-hidden">
        {q.data?.map((e: any) => (
          <div key={e.id} className="grid grid-cols-[140px_120px_1fr] gap-4 items-center px-5 py-3 border-b border-black/5 last:border-0">
            <div className="text-xs font-mono text-ink-muted">{new Date(e.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</div>
            <span className={`px-2 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider justify-self-start ${KIND_COLOR[e.kind] ?? 'bg-cream text-ink-soft'}`}>
              {e.kind.replace('-', ' ')}
            </span>
            <div className="text-sm min-w-0">
              {e.case && (
                <Link to={`/${orgSlug}/team/cases/${e.case_id}`} className="font-mono text-xs text-rust mr-2">
                  {e.case.short_id}
                </Link>
              )}
              <span className="text-ink-soft">{e.case?.threat_summary ?? ''}</span>
              {e.payload?.to && <span className="text-ink-muted"> → {e.payload.to}</span>}
              {e.actor?.display_name && <span className="text-ink-muted text-xs ml-2">by {e.actor.display_name}</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
