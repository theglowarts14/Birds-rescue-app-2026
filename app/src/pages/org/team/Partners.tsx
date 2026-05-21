import { useQuery } from '@tanstack/react-query';
import { useOrg } from '../../../lib/org';
import { listPartners } from '../../../lib/queries';
import { PageHeader, LoadingRow, EmptyState } from '../../../components/ui';
import { Building2, Plus, AlertOctagon } from 'lucide-react';

const KIND_ICON: Record<string, string> = {
  cruelty: '🚨',
  cattle:  '🐄',
  wildlife:'🦉',
  snakes:  '🐍',
  borewell:'🕳️',
  overflow:'🪣',
};

export default function Partners() {
  const { org } = useOrg();
  const q = useQuery({ queryKey: ['partners', org?.id], queryFn: () => listPartners(org!.id), enabled: !!org?.id });

  return (
    <>
      <PageHeader kicker="Auto-router" title="Partner NGOs" accent="we hand off to.">
        <button disabled title="Coming soon" className="btn-primary opacity-60 cursor-not-allowed">
          <Plus size={14} /> Add partner
          <span className="ml-1 text-[9px] font-mono uppercase tracking-widest opacity-70">Soon</span>
        </button>
      </PageHeader>

      {q.isLoading && <LoadingRow />}
      {!q.isLoading && q.data?.length === 0 && <EmptyState icon={<Building2 size={28} />} title="No partners yet" hint="Add the goshala, PFA, forest dept., etc. that you hand off cases to." />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {q.data?.map((p: any) => (
          <div key={p.id} className={`card ${p.is_flag_only ? 'border-rust/30' : ''}`}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">{KIND_ICON[p.kind] ?? '🤝'}</span>
              <div className="flex-1 min-w-0">
                <div className="display text-lg truncate">{p.name}</div>
                <div className="text-xs text-ink-muted uppercase font-mono">{p.kind}</div>
                {p.contact_name && <div className="text-sm mt-2">{p.contact_name}</div>}
                {p.notes && <div className="text-xs text-ink-soft mt-1">{p.notes}</div>}
                {p.is_flag_only && (
                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-rust bg-rust/10 px-2 py-1 rounded-full">
                    <AlertOctagon size={11} /> Flag only · never dispatch
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
