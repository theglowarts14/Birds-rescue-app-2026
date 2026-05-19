import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Activity, Trophy, Clock, Edit3, ListChecks,
} from 'lucide-react';
import { useOrg } from '../../../lib/org';
import {
  getMemberDetail, updateMemberServiceAreas, updateMemberDispatchPriority,
  listAreaDensity,
} from '../../../lib/queries';
import { PageHeader, LoadingRow, ErrorRow, Stat } from '../../../components/ui';
import { ServiceAreasEditor } from '../../../components/ServiceAreasEditor';

const ROLE_CHIP: Record<string, string> = {
  owner: 'bg-rust/15 text-rust',
  coordinator: 'bg-sky/15 text-sky',
  vet: 'bg-moss/15 text-moss',
  field: 'bg-amber/15 text-amber',
  foster: 'bg-cream text-ink-soft',
  awareness: 'bg-cream text-ink-soft',
};

export default function VolunteerProfile() {
  const { userId, orgSlug } = useParams();
  const { org } = useOrg();
  const orgId = org?.id;
  const qc = useQueryClient();

  const detail = useQuery({
    queryKey: ['member-detail', orgId, userId],
    queryFn: () => getMemberDetail(orgId!, userId!),
    enabled: !!orgId && !!userId,
  });

  const areas = useQuery({
    queryKey: ['area-density', orgId],
    queryFn: () => listAreaDensity(orgId!),
    enabled: !!orgId,
  });
  const areaSuggestions = useMemo(
    () => (areas.data ?? []).map((a: any) => a.area).filter(Boolean),
    [areas.data],
  );

  const [editingAreas, setEditingAreas] = useState(false);

  const saveAreas = useMutation({
    mutationFn: (next: string[]) => updateMemberServiceAreas(orgId!, userId!, next),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['member-detail', orgId, userId] });
      qc.invalidateQueries({ queryKey: ['members', orgId] });
      setEditingAreas(false);
    },
  });

  const savePriority = useMutation({
    mutationFn: (next: number) => updateMemberDispatchPriority(orgId!, userId!, next),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['member-detail', orgId, userId] }),
  });

  if (detail.isLoading) return <LoadingRow />;
  if (detail.isError) return <ErrorRow err={detail.error} />;
  if (!detail.data?.member) return <p className="text-sm text-ink-soft">Member not found in this org.</p>;

  const { member, metrics, cases, shifts } = detail.data;
  const m = member as any;
  const mm = (metrics ?? {}) as any;
  const initial = (m.profile?.display_name?.[0] ?? '?').toUpperCase();

  return (
    <>
      <Link to={`/${orgSlug}/team/volunteers`} className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink mb-4">
        <ArrowLeft size={14} /> Roster
      </Link>

      <div className="card mb-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-full bg-cream grid place-items-center text-2xl font-medium text-ink-soft">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="kicker">Volunteer profile</div>
            <h1 className="display text-2xl sm:text-3xl mt-1">{m.profile?.display_name ?? 'Unnamed'}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${ROLE_CHIP[m.role] ?? 'bg-cream text-ink-soft'}`}>
                {m.role}
              </span>
              {m.profile?.phone_e164 && (
                <span className="text-sm text-ink-soft font-mono">{m.profile.phone_e164}</span>
              )}
              {m.profile?.email && (
                <span className="text-sm text-ink-soft">· {m.profile.email}</span>
              )}
            </div>
          </div>
          <div>
            <a href={m.profile?.phone_e164 ? `tel:${m.profile.phone_e164}` : '#'} className="btn-primary">
              Call
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat
          label="Accept rate"
          value={mm.accept_rate != null ? `${mm.accept_rate}%` : '—'}
          accent={mm.accept_rate >= 80 ? 'moss' : mm.accept_rate >= 50 ? 'amber' : 'rust'}
          sub={`${mm.dispatches_accepted ?? 0} of ${mm.dispatches_offered ?? 0} dispatches`}
        />
        <Stat
          label="Avg response"
          value={mm.avg_response_seconds ? `${Math.round(mm.avg_response_seconds / 60)}m` : '—'}
          sub="dispatched → en-route, 90d"
        />
        <Stat
          label="Cases handled"
          value={mm.cases_handled ?? 0}
          accent="sky"
          sub={`${mm.cases_released ?? 0} released`}
        />
        <Stat
          label="Last active"
          value={mm.last_active_at ? agoShort(mm.last_active_at) : 'never'}
          sub={mm.last_active_at ? new Date(mm.last_active_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-5">
          {!editingAreas ? (
            <section className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="kicker flex items-center gap-1.5"><MapPin size={11} /> Service areas</div>
                <button onClick={() => setEditingAreas(true)} className="text-xs text-rust hover:text-rust/80 inline-flex items-center gap-1">
                  <Edit3 size={12} /> Edit
                </button>
              </div>
              {(m.service_areas?.length ?? 0) === 0 ? (
                <p className="text-sm text-ink-soft italic">No areas set. They won't be preferred for any specific area.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {m.service_areas.map((a: string) => (
                    <span key={a} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky/15 text-sky text-xs">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <ServiceAreasEditor
              value={m.service_areas ?? []}
              suggestions={areaSuggestions}
              onSave={(next) => saveAreas.mutate(next)}
              onCancel={() => setEditingAreas(false)}
            />
          )}

          <section className="card">
            <div className="kicker flex items-center gap-1.5 mb-2"><Trophy size={11} /> Dispatch priority</div>
            <p className="text-xs text-ink-soft mb-3">
              0 = last resort, 100 = top of the list. The auto-router picks higher priorities first.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range" min={0} max={100} step={5}
                defaultValue={m.dispatch_priority ?? 50}
                onChange={(e) => savePriority.mutate(parseInt(e.target.value, 10))}
                className="flex-1 accent-rust"
              />
              <span className="font-mono text-sm w-10 text-right">{m.dispatch_priority ?? 50}</span>
            </div>
          </section>

          <section className="card">
            <div className="kicker flex items-center gap-1.5 mb-2"><Clock size={11} /> Recent shifts</div>
            {shifts.length === 0 && <p className="text-sm text-ink-soft italic">No shifts logged.</p>}
            <ul className="space-y-1.5">
              {shifts.slice(0, 6).map((s: any) => (
                <li key={s.id} className="flex justify-between text-xs">
                  <span className="text-ink-soft">
                    {new Date(s.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="font-mono">
                    {duration(s.starts_at, s.ends_at)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="display text-xl"><Activity size={16} className="inline mr-1" /> Assigned cases</h3>
            <span className="kicker">{cases.length} TOTAL · last 20</span>
          </div>
          {cases.length === 0 ? (
            <p className="text-sm text-ink-soft italic">No cases assigned yet.</p>
          ) : (
            <ul className="space-y-2">
              {cases.map((c: any) => (
                <li key={c.id}>
                  <Link to={`/${orgSlug}/team/cases/${c.id}`} className="grid grid-cols-[60px_1fr_auto_auto] gap-3 items-center p-2.5 bg-cream/40 rounded-xl hover:bg-cream transition">
                    <span className="font-mono text-[11px] text-rust">{c.short_id}</span>
                    <div className="min-w-0">
                      <div className="display text-sm truncate">{c.species_name ?? c.species_freetext ?? c.kind}</div>
                      <div className="text-[11px] text-ink-soft truncate">{c.area ?? '—'}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${
                      c.status === 'critical' ? 'bg-rust/15 text-rust' :
                      c.status === 'released' ? 'bg-sky/15 text-sky' :
                      c.status === 'recovering' ? 'bg-moss/15 text-moss' : 'bg-amber/15 text-amber'
                    }`}>{c.status}</span>
                    <span className="text-[11px] text-ink-soft font-mono">
                      {new Date(c.received_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6 text-xs text-ink-muted inline-flex items-center gap-1.5">
        <ListChecks size={12} /> Metrics refresh on every page load. The 80% accept-rate threshold marks dependable dispatch.
      </div>
    </>
  );
}

function agoShort(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

function duration(start: string, end: string | null): string {
  const ms = (end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime();
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
