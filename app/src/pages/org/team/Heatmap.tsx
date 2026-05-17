import { useQuery } from '@tanstack/react-query';
import { useOrg } from '../../../lib/org';
import { listAreaDensity } from '../../../lib/queries';
import { PageHeader, LoadingRow, EmptyState } from '../../../components/ui';
import { Map } from 'lucide-react';

export default function Heatmap() {
  const { org } = useOrg();
  const q = useQuery({ queryKey: ['areas', org?.id], queryFn: () => listAreaDensity(org!.id), enabled: !!org?.id });
  const max = Math.max(1, ...(q.data ?? []).map((a: any) => a.active_count));

  return (
    <>
      <PageHeader kicker="Geography" title="Where the city" accent="bleeds." />

      <p className="text-sm text-ink-soft mb-5 max-w-xl">
        Active cases by area. Dense rows are where you should be looking for patterns — repeat reporters,
        problem buildings, festival hotspots. Future versions will overlay this on a real map.
      </p>

      {q.isLoading && <LoadingRow />}
      {!q.isLoading && q.data?.length === 0 && <EmptyState icon={<Map size={28} />} title="No active cases right now" />}

      <div className="card !p-0 overflow-hidden">
        {q.data?.map((row: any) => (
          <div key={row.area} className="grid grid-cols-[1fr_3fr_60px_60px] gap-3 items-center px-5 py-3 border-b border-black/5 last:border-0">
            <div className="display truncate">{row.area ?? 'Unknown'}</div>
            <div className="h-2 bg-cream rounded-full overflow-hidden">
              <div className="h-full bg-rust" style={{ width: `${(row.active_count / max) * 100}%` }} />
            </div>
            <div className="text-sm font-mono text-right">{row.active_count}</div>
            <div className="text-xs text-rust text-right">{row.critical_count > 0 ? `${row.critical_count} crit` : ''}</div>
          </div>
        ))}
      </div>
    </>
  );
}
