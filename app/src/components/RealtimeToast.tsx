import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Radio, X } from 'lucide-react';
import { onNewCase, type NewCasePayload } from '../lib/realtime';

// New-case toast banner. Mounted once near the app root; listens for
// `karuna:new-case` events emitted by useRealtimeCases. Stacks up to 3, each
// auto-dismissing after 10s. Critical cases get rust accent and stay longer.
//
// Click navigates to the case. Editorial style — no garish notification
// chrome. Top-right anchored; full-width-minus-padding on mobile.

interface ToastItem {
  id: string;
  case: NewCasePayload;
  receivedAt: number;
}

const MAX_STACK = 3;
const NORMAL_TTL_MS = 10_000;
const CRITICAL_TTL_MS = 20_000;

export function RealtimeToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { orgSlug } = useParams();

  useEffect(() => {
    const off = onNewCase((c) => {
      setToasts((prev) => [
        { id: c.id, case: c, receivedAt: Date.now() },
        ...prev.slice(0, MAX_STACK - 1),
      ]);
      if (c.urgency === 'critical') {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = 880; o.type = 'sine';
          g.gain.setValueAtTime(0.08, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          o.start(); o.stop(ctx.currentTime + 0.4);
        } catch { /* audio context blocked in some browsers; fine */ }
      }
    });
    return off;
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setToasts((prev) =>
        prev.filter((t) => {
          const ttl = t.case.urgency === 'critical' ? CRITICAL_TTL_MS : NORMAL_TTL_MS;
          return now - t.receivedAt < ttl;
        }),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [toasts.length]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-[min(360px,calc(100vw-2rem))]">
      {toasts.map((t) => (
        <ToastCard
          key={t.id}
          c={t.case}
          orgSlug={orgSlug}
          onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
        />
      ))}
    </div>
  );
}

function ToastCard({ c, orgSlug, onClose }: { c: NewCasePayload; orgSlug?: string; onClose: () => void }) {
  const critical = c.urgency === 'critical';
  const link = orgSlug ? `/${orgSlug}/team/cases/${c.id}` : `#`;

  return (
    <div
      className={[
        'relative rounded-2xl border shadow-2xl overflow-hidden animate-slide-in-right',
        critical ? 'bg-paper border-rust/40 ring-2 ring-rust/20' : 'bg-paper border-black/10',
      ].join(' ')}
    >
      {critical && <div className="h-1 bg-rust" />}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Radio size={11} className={critical ? 'text-rust animate-pulse' : 'text-moss'} />
          <span className={`kicker ${critical ? 'text-rust' : 'text-moss'}`}>
            {critical ? 'Critical · just landed' : 'New case'}
          </span>
          <button onClick={onClose} className="ml-auto p-1 text-ink-soft hover:text-ink">
            <X size={12} />
          </button>
        </div>
        <Link to={link} onClick={onClose} className="block hover:opacity-80">
          <div className="flex items-baseline gap-2">
            <span className={`font-mono text-[11px] font-bold ${critical ? 'text-rust' : 'text-ink-soft'}`}>
              {c.short_id}
            </span>
            <span className="display text-base truncate">
              {c.species_freetext ?? c.kind}
            </span>
          </div>
          {c.threat_summary && (
            <p className="text-xs text-ink-soft mt-1 line-clamp-2">{c.threat_summary}</p>
          )}
          {c.area && (
            <p className="text-[11px] text-ink-muted mt-1.5 font-mono">📍 {c.area}</p>
          )}
        </Link>
      </div>
    </div>
  );
}
