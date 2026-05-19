import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus, Search, X, MoreHorizontal, Shield, Trash2, Clock,
  CheckCircle2, AlertTriangle, Send, ExternalLink,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useOrg } from '../../../lib/org';
import { useAuth } from '../../../lib/auth';
import {
  listOrgMembers, listPendingInvites, inviteMember,
  updateMemberRole, removeMember, cancelPendingInvite,
} from '../../../lib/queries';
import { PageHeader, LoadingRow, EmptyState, Stat } from '../../../components/ui';

type Role = 'owner' | 'coordinator' | 'vet' | 'field' | 'foster' | 'awareness';

const ROLES: { value: Role; label: string; blurb: string; chip: string }[] = [
  { value: 'owner',       label: 'Owner',       blurb: 'Manages members, settings, billing. Treat as a trustee.', chip: 'bg-rust/15 text-rust' },
  { value: 'coordinator', label: 'Coordinator', blurb: 'Triages cases, dispatches volunteers, marks status.',     chip: 'bg-sky/15 text-sky' },
  { value: 'vet',         label: 'Vet',         blurb: 'Writes treatment notes; reads everything; signs releases.', chip: 'bg-moss/15 text-moss' },
  { value: 'field',       label: 'Field rescuer', blurb: 'Accepts dispatches; logs en-route, rescued, in-care.',   chip: 'bg-amber/15 text-amber' },
  { value: 'foster',      label: 'Foster',      blurb: 'Houses recovering animals; logs daily updates.',          chip: 'bg-cream text-ink-soft' },
  { value: 'awareness',   label: 'Awareness',   blurb: 'Posts educational content; cannot touch case data.',      chip: 'bg-cream text-ink-soft' },
];

const ROLE_BY: Record<Role, typeof ROLES[number]> = Object.fromEntries(ROLES.map((r) => [r.value, r])) as never;

export default function Team() {
  const { org } = useOrg();
  const { session } = useAuth();
  const { orgSlug } = useParams();
  const qc = useQueryClient();
  const orgId = org?.id;
  const myUserId = session?.user.id;

  const members = useQuery({ queryKey: ['members', orgId], queryFn: () => listOrgMembers(orgId!), enabled: !!orgId });
  const invites = useQuery({ queryKey: ['invites', orgId], queryFn: () => listPendingInvites(orgId!), enabled: !!orgId });

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [showInvite, setShowInvite] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<MemberRow | null>(null);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);

  const rows: MemberRow[] = (members.data ?? []) as never;
  const pending = (invites.data ?? []) as PendingRow[];

  const ownerCount = useMemo(() => rows.filter((r) => r.role === 'owner').length, [rows]);
  const onShift   = useMemo(() => rows.filter((r) => r.current_status === 'on-shift').length, [rows]);
  const roleCount = useMemo(() => {
    const c: Record<Role, number> = { owner: 0, coordinator: 0, vet: 0, field: 0, foster: 0, awareness: 0 };
    for (const r of rows) c[r.role as Role] = (c[r.role as Role] ?? 0) + 1;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (roleFilter !== 'all' && r.role !== roleFilter) return false;
      if (!q) return true;
      const name = (r.profile?.display_name ?? '').toLowerCase();
      const phone = (r.profile?.phone_e164 ?? '').toLowerCase();
      const email = (r.profile?.email ?? '').toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [rows, roleFilter, search]);

  return (
    <>
      <PageHeader kicker="Admin" title="Team" accent="people who answer the helpline.">
        <button onClick={() => setShowInvite((v) => !v)} className="btn-primary">
          <UserPlus size={14} /> Invite member
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Total members" value={rows.length} sub={`${ownerCount} owner${ownerCount === 1 ? '' : 's'}`} />
        <Stat label="On shift right now" value={onShift} accent="moss" sub="Available for dispatch" />
        <Stat label="Coordinators · vets" value={roleCount.coordinator + roleCount.vet} sub={`${roleCount.coordinator} coord · ${roleCount.vet} vet`} />
        <Stat label="Pending invites" value={pending.length} accent={pending.length > 0 ? 'amber' : undefined} sub={pending.length === 0 ? 'All accepted' : 'Not yet signed in'} />
      </div>

      {showInvite && (
        <InvitePanel
          orgId={orgId!}
          onDone={() => {
            qc.invalidateQueries({ queryKey: ['members', orgId] });
            qc.invalidateQueries({ queryKey: ['invites', orgId] });
            setShowInvite(false);
          }}
          onCancel={() => setShowInvite(false)}
        />
      )}

      <div className="card mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email"
              className="w-full pl-9 pr-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-soft hover:text-ink">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <RoleChip active={roleFilter === 'all'} onClick={() => setRoleFilter('all')} chip="bg-ink text-paper">
              All · {rows.length}
            </RoleChip>
            {ROLES.map((r) => roleCount[r.value] > 0 && (
              <RoleChip
                key={r.value}
                active={roleFilter === r.value}
                onClick={() => setRoleFilter(r.value)}
                chip={r.chip}
              >
                {r.label} · {roleCount[r.value]}
              </RoleChip>
            ))}
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="card !p-0 overflow-hidden mb-4 border-amber/40">
          <div className="px-5 py-3 bg-amber/10 text-[11px] font-mono uppercase tracking-widest text-amber border-b border-amber/30 flex items-center gap-2">
            <Clock size={12} /> Pending invites
          </div>
          {pending.map((p) => (
            <div key={p.id} className="grid grid-cols-[1.5fr_1.2fr_1fr_auto] gap-2 items-center px-5 py-3 border-b border-black/5 last:border-0">
              <div>
                <div className="display">{p.display_name ?? <span className="text-ink-soft italic">unnamed</span>}</div>
                <div className="text-[11px] text-ink-soft mt-0.5">Invited {timeAgo(p.created_at)}</div>
              </div>
              <div className="text-sm text-ink-soft font-mono">{p.phone_e164}</div>
              <div><RoleBadge role={p.role as Role} /></div>
              <button
                onClick={async () => {
                  await cancelPendingInvite(orgId!, p.id);
                  qc.invalidateQueries({ queryKey: ['invites', orgId] });
                }}
                className="text-xs text-ink-soft hover:text-rust px-2 py-1 inline-flex items-center gap-1"
                title="Cancel invite"
              >
                <X size={12} /> Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      {members.isLoading && <LoadingRow />}
      {!members.isLoading && rows.length === 0 && (
        <EmptyState
          icon={<UserPlus size={28} />}
          title="No members yet"
          hint="Invite your first volunteer to get started."
        />
      )}
      {!members.isLoading && rows.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon={<Search size={28} />}
          title="No matches"
          hint="Clear the search or change the role filter."
        />
      )}

      {filtered.length > 0 && (
        <div className="card !p-0 overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1.2fr_1fr_1fr_auto] px-5 py-3 bg-cream text-[10px] font-mono tracking-widest uppercase text-ink-muted border-b border-black/10">
            <div>Member</div><div>Phone</div><div>Role</div><div>Shift</div><div></div>
          </div>
          {filtered.map((m) => (
            <MemberRow
              key={`${m.user_id}-${m.role}`}
              m={m}
              isMe={m.user_id === myUserId}
              isLastOwner={m.role === 'owner' && ownerCount <= 1}
              menuOpen={openMenuFor === m.user_id}
              profileHref={`/${orgSlug}/team/volunteers/${m.user_id}`}
              onToggleMenu={() => setOpenMenuFor(openMenuFor === m.user_id ? null : m.user_id)}
              onChangeRole={async (newRole) => {
                await updateMemberRole(orgId!, m.user_id, newRole);
                qc.invalidateQueries({ queryKey: ['members', orgId] });
                setOpenMenuFor(null);
              }}
              onAskRemove={() => { setConfirmRemove(m); setOpenMenuFor(null); }}
            />
          ))}
        </div>
      )}

      <div className="mt-6 card">
        <div className="kicker mb-3">What the roles mean</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <div key={r.value} className="flex items-start gap-3">
              <RoleBadge role={r.value} />
              <div className="text-xs text-ink-soft leading-relaxed">{r.blurb}</div>
            </div>
          ))}
        </div>
      </div>

      {confirmRemove && (
        <ConfirmRemove
          member={confirmRemove}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={async () => {
            await removeMember(orgId!, confirmRemove.user_id);
            qc.invalidateQueries({ queryKey: ['members', orgId] });
            setConfirmRemove(null);
          }}
        />
      )}
    </>
  );
}

function RoleChip({ active, chip, children, onClick }: { active: boolean; chip: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide transition',
        active ? chip + ' ring-1 ring-current' : 'bg-cream text-ink-soft hover:text-ink',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const r = ROLE_BY[role] ?? ROLE_BY.field;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${r.chip}`}>
      {role === 'owner' && <Shield size={10} className="mr-1" />}
      {r.label}
    </span>
  );
}

function MemberRow({
  m, isMe, isLastOwner, menuOpen, profileHref, onToggleMenu, onChangeRole, onAskRemove,
}: {
  m: MemberRow;
  isMe: boolean;
  isLastOwner: boolean;
  menuOpen: boolean;
  profileHref: string;
  onToggleMenu: () => void;
  onChangeRole: (role: Role) => void;
  onAskRemove: () => void;
}) {
  const name = m.profile?.display_name ?? '—';
  const initial = (name[0] ?? '?').toUpperCase();
  const onShift = m.current_status === 'on-shift';

  return (
    <div className="relative grid grid-cols-[2fr_1.2fr_1fr_1fr_auto] gap-2 items-center px-5 py-3 border-b border-black/5 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-9 h-9 rounded-full bg-cream grid place-items-center text-sm font-medium text-ink-soft">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="display truncate">
            {name}
            {isMe && <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-ink-soft">You</span>}
          </div>
          {m.profile?.email && (
            <div className="text-[11px] text-ink-soft truncate">{m.profile.email}</div>
          )}
        </div>
      </div>

      <div className="text-sm text-ink-soft font-mono truncate">{m.profile?.phone_e164 ?? '—'}</div>

      <div><RoleBadge role={m.role as Role} /></div>

      <div className="flex items-center gap-1.5 text-xs">
        <span className={[
          'inline-block w-1.5 h-1.5 rounded-full',
          onShift ? 'bg-moss' : 'bg-black/20',
        ].join(' ')} />
        <span className={onShift ? 'text-moss' : 'text-ink-soft'}>
          {onShift ? 'On shift' : (m.current_status ?? 'Off')}
        </span>
      </div>

      <div className="justify-self-end">
        <button onClick={onToggleMenu} className="p-1.5 rounded-lg hover:bg-cream text-ink-soft hover:text-ink">
          <MoreHorizontal size={16} />
        </button>
        {menuOpen && (
          <div className="absolute right-3 top-12 z-10 w-56 bg-paper rounded-xl border border-black/10 shadow-lg overflow-hidden">
            <Link
              to={profileHref}
              className="w-full text-left px-3 py-2 text-xs hover:bg-cream inline-flex items-center gap-2 border-b border-black/5"
            >
              <ExternalLink size={12} /> Open profile · areas, priority
            </Link>
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-ink-muted border-b border-black/5">
              Change role
            </div>
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => onChangeRole(r.value)}
                disabled={r.value === m.role || (isLastOwner && r.value !== 'owner')}
                title={isLastOwner && r.value !== 'owner' ? 'Cannot demote the last owner' : undefined}
                className="w-full text-left px-3 py-2 text-xs hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RoleBadge role={r.value} />
                {r.value === m.role && <CheckCircle2 size={12} className="ml-auto text-moss" />}
              </button>
            ))}
            <button
              onClick={onAskRemove}
              disabled={isLastOwner}
              title={isLastOwner ? 'Cannot remove the last owner' : undefined}
              className="w-full text-left px-3 py-2 text-xs text-rust hover:bg-rust/10 border-t border-black/5 inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 size={12} /> Remove from team
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InvitePanel({ orgId, onDone, onCancel }: { orgId: string; onDone: () => void; onCancel: () => void }) {
  const [phone, setPhone]   = useState('+91');
  const [name, setName]     = useState('');
  const [role, setRole]     = useState<Role>('field');
  const [error, setError]   = useState<string | null>(null);

  const invite = useMutation({
    mutationFn: () => {
      if (!/^\+91\d{10}$/.test(phone)) throw new Error('Phone must be +91 followed by 10 digits.');
      return inviteMember(orgId, phone, role, name.trim() || undefined);
    },
    onError: (e: Error) => setError(e.message),
    onSuccess: onDone,
  });

  return (
    <div className="card mb-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="kicker">Invite a member</div>
          <h3 className="display text-lg mt-1">{ROLE_BY[role].label}</h3>
          <p className="text-xs text-ink-soft mt-1 max-w-md">{ROLE_BY[role].blurb}</p>
        </div>
        <button onClick={onCancel} className="p-1.5 text-ink-soft hover:text-ink"><X size={16} /></button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1">
          <label className="block text-xs text-ink-muted mb-1">Name (optional)</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Reddy"
            className="w-full px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm" />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-xs text-ink-muted mb-1">Phone (E.164)</label>
          <input value={phone} onChange={(e) => { setError(null); setPhone(e.target.value); }} placeholder="+91 9XXXXXXXXX"
            className="w-full px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm font-mono" />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-xs text-ink-muted mb-1">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}
            className="w-full px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm">
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-3 text-xs text-rust inline-flex items-center gap-1.5">
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-4">
        <button onClick={() => invite.mutate()} disabled={invite.isPending} className="btn-primary">
          <Send size={14} /> {invite.isPending ? 'Sending…' : 'Send OTP invite'}
        </button>
        <p className="text-[11px] text-ink-soft">
          They'll receive a 6-digit code by SMS, finish sign-in, and appear in the team list automatically.
        </p>
      </div>
    </div>
  );
}

function ConfirmRemove({ member, onCancel, onConfirm }: { member: MemberRow; onCancel: () => void; onConfirm: () => void }) {
  const [working, setWorking] = useState(false);
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm grid place-items-center p-4" onClick={onCancel}>
      <div className="bg-paper rounded-2xl border border-black/10 max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="kicker text-rust">Remove from team</div>
        <h3 className="display text-2xl mt-2">
          Remove <span className="italic">{member.profile?.display_name ?? 'this member'}</span>?
        </h3>
        <p className="text-sm text-ink-soft mt-3">
          They lose access to cases, donations, and the dispatch queue immediately.
          Their case history stays in the audit log. You can re-invite them anytime.
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-ink-soft hover:text-ink">Cancel</button>
          <button
            disabled={working}
            onClick={async () => { setWorking(true); await onConfirm(); }}
            className="px-4 py-2 text-sm bg-rust text-paper rounded-full inline-flex items-center gap-1.5 hover:bg-rust/90 disabled:opacity-60"
          >
            <Trash2 size={14} /> {working ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface MemberRow {
  user_id: string;
  org_id: string;
  role: string;
  current_status: string | null;
  profile?: {
    id: string;
    display_name: string | null;
    phone_e164: string | null;
    email: string | null;
    preferred_lang: string | null;
  };
}

interface PendingRow {
  id: string;
  org_id: string;
  phone_e164: string;
  role: string;
  display_name: string | null;
  created_at: string;
  accepted_at: string | null;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}
