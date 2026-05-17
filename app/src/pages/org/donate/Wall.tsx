import { useQuery } from '@tanstack/react-query';
import { useOrg } from '../../../lib/org';
import { listRecognitionWall } from '../../../lib/queries';
import { DonorNav } from '../../../components/ui';

export default function Wall() {
  const { org } = useOrg();
  const q = useQuery({ queryKey: ['wall', org?.id], queryFn: () => listRecognitionWall(org!.id), enabled: !!org?.id });

  const totals = (q.data ?? []).reduce<Record<string, number>>((acc, d: any) => {
    const name = d.donor?.name ?? 'Friend of birds';
    acc[name] = (acc[name] ?? 0) + d.amount_inr;
    return acc;
  }, {});
  const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a);

  return (
    <main className="max-w-[1320px] mx-auto px-4 sm:px-7 py-12">
      <DonorNav />

      <div className="kicker mb-4">Quiet thanks</div>
      <h1 className="display text-[clamp(36px,6vw,64px)] leading-[0.98] -tracking-[1px]">
        The people <em className="italic text-amber">who answered.</em>
      </h1>
      <p className="text-ink-soft max-w-xl mt-5 leading-relaxed">
        Donors who chose to show their name. Ordered by total given, but every name shaped a bird's day at some point.
      </p>

      <div className="card mt-10 columns-1 sm:columns-2 lg:columns-3 gap-x-8">
        {sorted.map(([name, amount]) => (
          <div key={name} className="break-inside-avoid mb-3 flex justify-between items-baseline gap-3 pb-2 border-b border-black/5">
            <span className="display">{name}</span>
            <span className="text-xs text-ink-muted font-mono">₹{amount.toLocaleString('en-IN')}</span>
          </div>
        ))}
        {sorted.length === 0 && !q.isLoading && (
          <p className="text-sm text-ink-soft italic">No public donors yet. Most prefer anonymity, which is also kind.</p>
        )}
      </div>
    </main>
  );
}
