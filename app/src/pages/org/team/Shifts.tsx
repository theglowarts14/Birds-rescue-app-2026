import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Square, Clock, Radio, History } from 'lucide-react';
import { useOrg } from '../../../lib/org';
import { useAuth } from '../../../lib/auth';
import {
  listActiveShifts, listOrgShiftsWeek, startShift, endShift,
} from '../../../lib/queries';
import { PageHeader, LoadingRow, Stat, EmptyState } from '../../../components/ui';

export default function Shifts() {
  const { org } = useOrg();
  const { session } = useAuth();
  const qc = useQueryClient();
  const orgId = org?.id;
  const meId = session?.user.id;

  const active = useQuery({
    queryKey: ['active-shifts', orgId],
    queryFn: () => listActiveShifts(orgId!),
    enabled: !!orgId,
    refetchInterval: 60_000,
  });
  const week = useQuery({
    queryKey: ['week-shifts', orgId],
    queryFn: () => listOrgShiftsWeek(orgId!),
    enabled: !!orgId,
  });

  const [areas, setAreas] = useState('');
  const [planned, setPlanned] = useState('');

  const mine = useMemo(
    () => (active.data ?? []).find((s: any) => s.user_id === meId),
    [active.data, meId],
  );

  const start = useMutation({
    mutationFn: () => startShift(
      orgId!,
      areas.trim() ? areas.split(',').map((a) => a.trim()).filter(Boolean) : undefined,
      planned ? new Date(planned).toISOString() : undefined,
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-shifts', orgId] });
      qc.invalidateQueries({ queryKey: ['week-shifts', orgId] });
      setAreas(''); setPlanned('');
    },
  });
  const stop = useMutation({
    mutationFn: () => endShift(orgId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-shifts', orgId] });
      qc.invalidateQueries({ queryKey: ['week-shifts', orgId] });
    },
  });

  const grouped = useMemo(() => {
    const byDay = new Map<string, ShiftRow[]>();
    for (const s of (week.data ?? []) as ShiftRow[]) {
      const key = new Date(s.starts_at).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      const arr = byDay.get(key) ?? [];
      arr.push(s);
      byDay.set(key, arr);
    }
    return Array.from(byDay.entries());
  }, [week.data]);

  const totalHoursThisWeek = useMemo(() => {
    let mins = 0;
    for (const s of (week.data ?? []) as ShiftRow[]) {
      const end = s.ends_at ? new Date(s.ends_at) : new Date();
      mins += (end.getTime() - new Date(s.starts_at).getTime()) / 60_000;
    }
    return Math.round(mins / 60);
  }, [week.data]);

  return (
    <>
      <PageHeader kicker="Roster" title="Shifts" accent="when the team is on." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="On shift now" value={active.data?.length ?? 0} accent="moss" sub="Available for dispatch" />
        <Stat label="This week" value={`${totalHoursThisWeek}h`} sub="Total volunteer hours" />
        <Stat label="My status" value={mine ? 'On' : 'Off'} accent={mine ? 'moss' : undefined} sub={mine ? since(mine.starts_at) + ' on shift' : 'Not on shift'} />
        <Stat label="Shifts logged" value={week.data?.length ?? 0} sub="last 7 days" />
      </div>

      <div className="card mb-5">
        {mine ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Radio size={14} className="text-moss" />
              <h3 className="display text-lg">You're on shift</h3>
              <span className="ml-auto text-[11px] text-ink-soft font-mono">
                Started {since(mine.starts_at)} ago
              </span>
            </div>
            {mine.area_focus && mine.area_focus.length > 0 && (
              <div className="text-xs text-ink-soft mb-3">
                Focus: <span className="font-mono">{mine.area_focus.join(' · ')}</span>
              </div>
            )}
            <button onClick={() => stop.mutate()} disabled={stop.isPending} className="btn-ghost">
              <Square size={12} /> {stop.isPending ? 'Ending…' : 'End my shift'}
            </button>
          </div>
        ) : (
          <div>
            <div className="kicker mb-2">Start a shift</div>
            <h3 className="display text-lg mb-3">Tell the team you're on.</h3>
            <div className="grid sm:grid-cols-[2fr_1fr_auto] gap-3 items-end">
              <div>
                <label className="block text-xs text-ink-muted mb-1">Focus areas (optional, comma-separated)</label>
                <input value={areas} onChange={(e) => setAreas(e.target.value)} placeholder="Banjara Hills, Jubilee Hills"
                  className="w-full px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1">Until (optional)</label>
                <input type="datetime-local" value={planned} onChange={(e) => setPlanned(e.target.value)}
                  className="w-full px-3 py-2.5 bg-cream rounded-xl border border-black/10 text-sm" />
              </div>
              <button onClick={() => start.mutate()} disabled={start.isPending} className="btn-primary">
                <Play size={12} /> {start.isPending ? 'Starting…' : 'Start shift'}
              </button>
            </div>
          </div>
        )}
      </div>

      <section className="card mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Radio size={14} className="text-moss" />
          <h3 className="display text-xl">On shift <em className="italic text-moss">right now</em></h3>
        </div>
        {active.isLoading && <LoadingRow />}
        {!active.isLoading && (active.data?.length ?? 0) === 0 && (
          <p className="text-sm text-ink-soft italic">No one is currently on shift. Coordinators will see incoming cases but won't be able to auto-dispatch.</p>
        )}
        <ul className="space-y-2">
          {(active.data ?? []).map((s: any) => (
            <li key={s.id} className="grid grid-cols-[28px_1fr_auto] gap-3 items-center p-2.5 bg-moss/5 rounded-xl">
              <div className="w-7 h-7 rounded-full bg-moss/20 grid place-items-center text-xs font-medium text-moss">
                {(s.profile?.display_name?.[0] ?? '?').toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="display truncate">{s.profile?.display_name ?? 'Volunteer'}</div>
                <div className="text-[11px] text-ink-soft truncate">
                  {s.area_focus?.length ? s.area_focus.join(' · ') : 'No focus area set'}
                  {s.notes && ` · ${s.notes}`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-moss font-mono">on {since(s.starts_at)}</div>
                {s.planned_end && (
                  <div className="text-[10px] text-ink-muted">until {new Date(s.planned_end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <div className="flex items-center gap-2 mb-3">
          <History size={14} className="text-ink-soft" />
          <h3 className="display text-xl">This <em className="italic">week</em></h3>
        </div>
        {week.isLoading && <LoadingRow />}
        {!week.isLoading && grouped.length === 0 && (
          <EmptyState icon={<Clock size={28} />} title="No shifts in the last 7 days" hint="Once volunteers start logging shifts, they'll appear here." />
        )}
        <div className="space-y-4">
          {grouped.map(([day, rows]) => (
            <div key={day}>
              <div className="kicker mb-2">{day}</div>
              <ul className="space-y-1.5">
                {rows.map((s) => (
                  <li key={s.id} className="grid grid-cols-[1fr_auto_auto] gap-3 text-sm items-center p-2 bg-cream/40 rounded-lg">
                    <div className="truncate">{s.profile?.display_name ?? '—'}</div>
                    <div className="text-[11px] text-ink-soft font-mono">
                      {new Date(s.starts_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      {' → '}
                      {s.ends_at ? new Date(s.ends_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'now'}
                    </div>
                    <div className={`text-[11px] font-mono ${s.ends_at ? 'text-ink-muted' : 'text-moss'}`}>
                      {duration(s.starts_at, s.ends_at)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

interface ShiftRow {
  id: string;
  user_id: string;
  starts_at: string;
  ends_at: string | null;
  planned_end: string | null;
  area_focus: string[] | null;
  notes: string | null;
  profile?: { id: string; display_name: string | null };
}

function since(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function duration(start: string, end: string | null): string {
  const ms = (end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime();
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
