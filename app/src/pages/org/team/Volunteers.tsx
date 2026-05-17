import { useQuery } from '@tanstack/react-query';
import { useOrg } from '../../../lib/org';
import { listOrgMembers } from '../../../lib/queries';
import { PageHeader, LoadingRow, EmptyState } from '../../../components/ui';
import { UserPlus, Circle } from 'lucide-react';

const STATUS_DOT: Record<string, string> = {
  'on-duty': 'text-moss',
  'in-field': 'text-rust',
  'on-call':  'text-amber',
  'off-duty': 'text-ink-muted',
};

export default function Volunteers() {
  const { org } = useOrg();
  const q = useQuery({ queryKey: ['members', org?.id], queryFn: () => listOrgMembers(org!.id), enabled: !!org?.id });

  return (
    <>
      <PageHeader kicker="Roster" title="Volunteers" accent="& coordinators.">
        <button className="btn-primary"><UserPlus size={14} /> Invite</button>
      </PageHeader>

      {q.isLoading && <LoadingRow />}
      {!q.isLoading && q.data?.length === 0 && <EmptyState icon="👥" title="No one on the team yet" hint="Invite your first volunteer with their phone number." />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {q.data?.map((m: any) => (
          <div key={`${m.user_id}-${m.role}`} className="card">
            <div className="flex justify-between items-start">
              <div>
                <div className="display text-lg">{m.profile?.display_name ?? m.profile?.phone_e164 ?? 'Volunteer'}</div>
                <div className="text-xs text-ink-muted">{m.profile?.phone_e164}</div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cream text-[10px] font-mono uppercase tracking-wider text-ink-soft">{m.role}</span>
            </div>
            <div className={`mt-3 inline-flex items-center gap-1.5 text-xs ${STATUS_DOT[m.current_status] ?? ''}`}>
              <Circle size={8} fill="currentColor" /> {m.current_status}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
