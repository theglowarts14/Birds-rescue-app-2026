import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, ChevronRight, Radio, MapPin, Search, X } from 'lucide-react';
import { useOrg } from '../../../lib/org';
import {
  listOrgMembers, listMemberMetrics, listActiveShifts,
} from '../../../lib/queries';
import { PageHeader, LoadingRow, EmptyState } from '../../../components/ui';

const ROLE_CHIP: Record<string, string> = {
  owner: 'bg-rust/15 text-rust',
  coordinator: 'bg-sky/15 text-sky',
  vet: 'bg-moss/15 text-moss',
  field: 'bg-amber/15 text-amber',
  foster: 'bg-cream text-ink-soft',
  awareness: 'bg-cream text-ink-soft',
};

export default function Volunteers() {
  const { org } = useOrg();
  const { orgSlug } = useParams();
  const orgId = org?.id;

  const members = useQuery({ queryKey: ['members', orgId], queryFn: () => listOrgMembers(orgId!), enabled: !!orgId });
  const metrics = useQuery({ queryKey: ['member-metrics', orgId], queryFn: () => listMemberMetrics(orgId!), enabled: !!orgId });
  const shifts  = useQuery({ queryKey: ['active-shifts', orgId], queryFn: () => listActiveShifts(orgId!), enabled: !!orgId, refetchInterval: 60_000 });

  const onShiftIds = useMemo(
    () => new Set((shifts.data ?? []).map((s: any) => s.user_id)),
    [shifts.data],
  );

  const metricsByUser = useMemo(() => {
    const m = new Map<string, any>();
    for (const row of metrics.data ?? []) m.set(row.user_id, row);
    return m;
  }, [metrics.data]);

  const [search, setSearch] = useState('');
  const [onShiftOnly, setOnShiftOnly] = useState(false);

  const rows = (members.data ?? []) as any[];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((m) => {
      if (onShiftOnly && !onShiftIds.has(m.user_id)) return false;
      if (!q) return true;
      const name = (m.profile?.display_name ?? '').toLowerCase();
      const phone = (m.profile?.phone_e164 ?? '').toLowerCase();
      const areas = (m.service_areas ?? []).join(' ').toLowerCase();
      return name.includes(q) || phone.includes(q) || areas.includes(q);
    });
  }, [rows, onShiftOnly, onShiftIds, search]);

  const ranked = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aOn = onShiftIds.has(a.user_id) ? 1 : 0;
      const bOn = onShiftIds.has(b.user_id) ? 1 : 0;
      if (aOn !== bOn) return bOn - aOn;
      const am = metricsByUser.get(a.user_id) ?? {};
      const bm = metricsByUser.get(b.user_id) ?? {};
      const ar = am.accept_rate ?? -1;
      const br = bm.accept_rate ?? -1;
      if (ar !== br) return br - ar;
      return (b.dispatch_priority ?? 50) - (a.dispatch_priority ?? 50);
    });
  }, [filtered, metricsByUser, onShiftIds]);

  return (
    <>
      <PageHeader kicker="Roster" title="Volunteers" accent="& coordinators.">
        <Link to={`/${orgSlug}/admin/team`} className="btn-primary"><UserPlus size={14} /> Manage team</Link>
      </PageHeader>

      <div className="card mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, area"
              className="w-full pl-9 pr-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-soft hover:text-ink">
                <X size={14} />
              </button>
            )}
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-ink-soft cursor-pointer">
            <input type="checkbox" checked={onShiftOnly} onChange={(e) => setOnShiftOnly(e.target.checked)} className="accent-moss" />
            On-shift only · <span className="text-moss font-mono">{onShiftIds.size}</span>
          </label>
        </div>
      </div>

      {members.isLoading && <LoadingRow />}
      {!members.isLoading && rows.length === 0 && (
        <EmptyState icon={<UserPlus size={28} />} title="No one on the team yet" hint="Invite your first volunteer from the admin Team page." />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ranked.map((m) => {
          const mm = metricsByUser.get(m.user_id) ?? {};
          const onShift = onShiftIds.has(m.user_id);
          const accept = mm.accept_rate;
          const acceptColor = accept == null ? 'text-ink-soft' : accept >= 80 ? 'text-moss' : accept >= 50 ? 'text-amber' : 'text-rust';
          return (
            <Link
              key={`${m.user_id}-${m.role}`}
              to={`/${orgSlug}/team/volunteers/${m.user_id}`}
              className="card hover:bg-cream/40 transition group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {onShift && <Radio size={12} className="text-moss shrink-0" />}
                    <div className="display text-lg truncate">{m.profile?.display_name ?? 'Volunteer'}</div>
                  </div>
                  <div className="text-[11px] text-ink-soft font-mono mt-0.5">{m.profile?.phone_e164 ?? '—'}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider shrink-0 ${ROLE_CHIP[m.role] ?? 'bg-cream text-ink-soft'}`}>
                  {m.role}
                </span>
              </div>

              {(m.service_areas?.length ?? 0) > 0 && (
                <div className="mt-3 flex items-start gap-1.5 text-[11px] text-ink-soft">
                  <MapPin size={11} className="shrink-0 mt-0.5" />
                  <span className="truncate">{m.service_areas.slice(0, 3).join(' · ')}{m.service_areas.length > 3 && ` +${m.service_areas.length - 3}`}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-black/5 text-center">
                <Mini label="Accept" value={accept != null ? `${accept}%` : '—'} color={acceptColor} />
                <Mini label="Cases" value={mm.cases_handled ?? 0} />
                <Mini label="Priority" value={m.dispatch_priority ?? 50} />
              </div>

              <div className="flex items-center justify-end mt-2 text-[10px] text-ink-soft group-hover:text-rust">
                Profile <ChevronRight size={10} />
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function Mini({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div>
      <div className="text-[9px] font-mono uppercase tracking-widest text-ink-muted">{label}</div>
      <div className={`text-sm font-medium mt-0.5 ${color ?? ''}`}>{value}</div>
    </div>
  );
}
