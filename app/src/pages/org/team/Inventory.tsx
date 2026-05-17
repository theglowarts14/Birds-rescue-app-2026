import { useQuery } from '@tanstack/react-query';
import { useOrg } from '../../../lib/org';
import { listInventory } from '../../../lib/queries';
import { PageHeader, LoadingRow, EmptyState } from '../../../components/ui';
import { AlertTriangle, Plus, Boxes } from 'lucide-react';

export default function Inventory() {
  const { org } = useOrg();
  const q = useQuery({ queryKey: ['inventory', org?.id], queryFn: () => listInventory(org!.id), enabled: !!org?.id });
  const low = q.data?.filter((r: any) => r.low) ?? [];

  return (
    <>
      <PageHeader kicker="Stock" title="Inventory" accent="& low alerts.">
        <button className="btn-primary"><Plus size={14} /> New item</button>
      </PageHeader>

      {low.length > 0 && (
        <div className="card bg-amber/10 border-amber/30 mb-4">
          <div className="flex items-center gap-2 text-amber">
            <AlertTriangle size={16} />
            <span className="display text-lg">{low.length} items low on stock</span>
          </div>
          <div className="text-sm text-ink-soft mt-1">Pick up at the next supply run: {low.map((r: any) => r.item).join(' · ')}.</div>
        </div>
      )}

      {q.isLoading && <LoadingRow />}
      {!q.isLoading && q.data?.length === 0 && <EmptyState icon={<Boxes size={28} />} title="No inventory tracked yet" />}

      <div className="card !p-0 overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.5fr_100px_100px_100px_120px] px-5 py-3 bg-cream text-[10px] font-mono tracking-widest uppercase text-ink-muted border-b border-black/10">
          <div>Item</div><div>Stock</div><div>Unit</div><div>Low at</div><div></div>
        </div>
        {q.data?.map((r: any) => (
          <div key={r.id} className="grid grid-cols-[1.5fr_100px_100px_100px_120px] gap-2 items-center px-5 py-3 border-b border-black/10 last:border-0">
            <div className="display">{r.item}</div>
            <div className={`font-mono ${r.low ? 'text-amber font-bold' : ''}`}>{r.stock}</div>
            <div className="text-xs text-ink-muted">{r.unit}</div>
            <div className="text-xs text-ink-soft">{r.low_threshold}</div>
            <div>
              {r.low ? (
                <span className="px-2 py-1 rounded-full bg-amber/15 text-amber text-[10px] font-mono uppercase tracking-wider">Reorder</span>
              ) : (
                <span className="px-2 py-1 rounded-full bg-moss/15 text-moss text-[10px] font-mono uppercase tracking-wider">OK</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
