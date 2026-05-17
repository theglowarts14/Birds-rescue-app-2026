import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOrg } from '../../../lib/org';
import { listOrgMembers, inviteMember } from '../../../lib/queries';
import { PageHeader, LoadingRow, EmptyState } from '../../../components/ui';
import { UserPlus, Send } from 'lucide-react';

const ROLES = ['owner', 'coordinator', 'vet', 'field', 'foster', 'awareness'] as const;

export default function Team() {
  const { org } = useOrg();
  const qc = useQueryClient();
  const [phone, setPhone] = useState('+91');
  const [role, setRole] = useState<typeof ROLES[number]>('field');

  const members = useQuery({ queryKey: ['members', org?.id], queryFn: () => listOrgMembers(org!.id), enabled: !!org?.id });
  const invite = useMutation({
    mutationFn: async () => inviteMember(org!.id, phone, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members', org!.id] }); setPhone('+91'); },
  });

  return (
    <>
      <PageHeader kicker="Admin" title="Team" accent="members & roles." />

      <div className="card mb-5">
        <div className="kicker mb-3">Invite a volunteer</div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-ink-muted mb-1">Phone (E.164)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9XXXXXXXXX" className="w-full px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-ink-muted mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as any)} className="px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm">
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={() => invite.mutate()} disabled={invite.isPending} className="btn-primary">
            <Send size={14} /> Send OTP invite
          </button>
        </div>
        {invite.isSuccess && <div className="text-sm text-moss mt-3">OTP sent. They'll sign in and be added on first sign-in.</div>}
      </div>

      {members.isLoading && <LoadingRow />}
      {!members.isLoading && members.data?.length === 0 && (
        <EmptyState icon={<UserPlus size={28} />} title="No members yet" hint="Invite your first volunteer above." />
      )}

      <div className="card !p-0 overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr] px-5 py-3 bg-cream text-[10px] font-mono tracking-widest uppercase text-ink-muted border-b border-black/10">
          <div>Name</div><div>Phone</div><div>Role</div><div>Status</div>
        </div>
        {members.data?.map((m: any) => (
          <div key={`${m.user_id}-${m.role}`} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 items-center px-5 py-3 border-b border-black/5 last:border-0">
            <div className="display">{m.profile?.display_name ?? '—'}</div>
            <div className="text-sm text-ink-soft font-mono">{m.profile?.phone_e164}</div>
            <div className="text-xs"><span className="px-2 py-0.5 rounded-full bg-cream uppercase tracking-wider">{m.role}</span></div>
            <div className="text-xs text-ink-soft">{m.current_status}</div>
          </div>
        ))}
      </div>
    </>
  );
}
