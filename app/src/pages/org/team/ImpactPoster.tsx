import { useQuery } from '@tanstack/react-query';
import { useOrg } from '../../../lib/org';
import { dashboardStats, listReleases } from '../../../lib/queries';
import { PageHeader, LoadingRow } from '../../../components/ui';
import { Download, Share2, Sparkles } from 'lucide-react';

export default function ImpactPoster() {
  const { org } = useOrg();
  const stats    = useQuery({ queryKey: ['stats', org?.id],    queryFn: () => dashboardStats(org!.id),  enabled: !!org?.id });
  const releases = useQuery({ queryKey: ['releases', org?.id], queryFn: () => listReleases(org!.id),   enabled: !!org?.id });

  const month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <>
      <PageHeader kicker="Auto-generated" title="Impact poster" accent={`· ${month}`}>
        <button disabled title="Coming soon" className="btn-ghost opacity-60 cursor-not-allowed">
          <Share2 size={14} /> Share to Insta
          <span className="ml-1 text-[9px] font-mono uppercase tracking-widest opacity-70">Soon</span>
        </button>
        <button disabled title="Coming soon" className="btn-primary opacity-60 cursor-not-allowed">
          <Download size={14} /> Download PNG
          <span className="ml-1 text-[9px] font-mono uppercase tracking-widest opacity-70">Soon</span>
        </button>
      </PageHeader>

      <p className="text-sm text-ink-soft mb-5 max-w-xl">
        Auto-rendered from this month's case data. Drop it on your story or attach to a grant report.
      </p>

      {(stats.isLoading || releases.isLoading) && <LoadingRow />}

      <div className="card bg-gradient-to-br from-cream via-paper to-creamDeep border-2 border-ink/10 p-10 max-w-2xl shadow-[0_30px_60px_-30px_rgba(0,0,0,0.3)]">
        <div className="text-center">
          <div className="kicker">{org?.public_name ?? org?.name}</div>
          <h2 className="display text-5xl mt-2 leading-[0.95] -tracking-[1px]">
            {month},
            <br />
            <em className="italic text-rust">in numbers.</em>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-10">
          <Big number={stats.data?.released ?? 0} label="released this month" accent="sky" />
          <Big number={stats.data?.inCare ?? 0} label="still in our care" accent="amber" />
          <Big number={stats.data?.total ?? 0} label="cases handled" accent="ink" />
          <Big number={`₹${((stats.data?.spendMTD ?? 0) / 1000).toFixed(1)}k`} label="rescue spend" accent="rust" />
        </div>

        <div className="mt-10">
          <div className="kicker mb-3">Some of the birds you helped</div>
          <div className="flex gap-1 overflow-hidden">
            {releases.data?.slice(0, 12).map((c) => (
              <span key={c.id} className="text-2xl" title={c.species_name ?? ''}>{c.species_emoji ?? '🪶'}</span>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-ink/10 text-center">
          <Sparkles size={14} className="inline text-amber mr-1" />
          <span className="text-xs text-ink-muted font-mono tracking-widest uppercase">When wings fall, we answer.</span>
        </div>
      </div>
    </>
  );
}

function Big({ number, label, accent }: { number: number | string; label: string; accent: 'rust'|'sky'|'amber'|'ink' }) {
  return (
    <div className="text-center">
      <div className={`display text-6xl -tracking-[1.5px] text-${accent}`}>{number}</div>
      <div className="text-sm text-ink-soft mt-1">{label}</div>
    </div>
  );
}
