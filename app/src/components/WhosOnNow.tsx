import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Radio, Play, Square } from 'lucide-react';
import { useOrg } from '../lib/org';
import { useAuth } from '../lib/auth';
import { listActiveShifts, startShift, endShift } from '../lib/queries';

export function WhosOnNow() {
  const { org } = useOrg();
  const { session } = useAuth();
  const qc = useQueryClient();
  const myUserId = session?.user.id;

  const shifts = useQuery({
    queryKey: ['active-shifts', org?.id],
    queryFn: () => listActiveShifts(org!.id),
    enabled: !!org?.id,
    refetchInterval: 60_000,
  });

  const mineActive = shifts.data?.find((s: any) => s.user_id === myUserId);

  const startMine = useMutation({
    mutationFn: () => startShift(org!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['active-shifts', org!.id] }),
  });
  const endMine = useMutation({
    mutationFn: () => endShift(org!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['active-shifts', org!.id] }),
  });

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-moss" />
          <h3 className="display text-lg">Who's on <em className="italic text-moss">now</em></h3>
        </div>
        <span className="kicker">{shifts.data?.length ?? 0} ACTIVE</span>
      </div>

      {(shifts.data?.length ?? 0) === 0 && (
        <p className="text-sm text-ink-soft italic">No one is on shift. Start yours below.</p>
      )}

      {(shifts.data?.length ?? 0) > 0 && (
        <ul className="space-y-2 mb-3">
          {shifts.data!.slice(0, 6).map((s: any) => (
            <li key={s.id} className="flex items-center gap-2.5 text-sm">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-moss animate-pulse" />
              <span className="display truncate">{s.profile?.display_name ?? 'Volunteer'}</span>
              {s.area_focus && s.area_focus.length > 0 && (
                <span className="text-[10px] text-ink-soft font-mono uppercase tracking-wider truncate">
                  · {s.area_focus.slice(0, 2).join(', ')}
                </span>
              )}
              <span className="ml-auto text-[10px] text-ink-muted font-mono">
                {since(s.starts_at)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-3 border-t border-black/5">
        {mineActive ? (
          <button
            onClick={() => endMine.mutate()}
            disabled={endMine.isPending}
            className="btn-ghost w-full justify-center"
          >
            <Square size={12} /> End my shift
          </button>
        ) : (
          <button
            onClick={() => startMine.mutate()}
            disabled={startMine.isPending}
            className="btn-primary w-full justify-center"
          >
            <Play size={12} /> Start my shift
          </button>
        )}
        <Link to="shifts" className="block text-center mt-2 text-[11px] text-ink-soft hover:text-ink">
          See the week →
        </Link>
      </div>
    </section>
  );
}

function since(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
