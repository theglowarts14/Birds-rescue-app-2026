import { useQuery } from '@tanstack/react-query';
import { useOrg } from '../../../lib/org';
import { dashboardStats } from '../../../lib/queries';
import { PageHeader } from '../../../components/ui';
import { Coins, ExternalLink, FileText } from 'lucide-react';

const GRANTS = [
  { name: 'Bill & Melinda Gates · Animal Welfare RFP',  amount: '₹15-50 lakhs', deadline: '2026-06-30', fit: 0.78 },
  { name: 'Azim Premji Philanthropic Initiatives',       amount: '₹5-25 lakhs',  deadline: '2026-07-15', fit: 0.92 },
  { name: 'EkStep Foundation · Wildlife strand',         amount: '₹10-30 lakhs', deadline: '2026-08-01', fit: 0.65 },
  { name: 'Tata Trusts · Urban biodiversity',            amount: '₹8-20 lakhs',  deadline: '2026-09-01', fit: 0.71 },
];

export default function Grants() {
  const { org } = useOrg();
  const stats = useQuery({ queryKey: ['stats', org?.id], queryFn: () => dashboardStats(org!.id), enabled: !!org?.id });

  return (
    <>
      <PageHeader kicker="Funding" title="Grant" accent="templates." />

      <p className="text-sm text-ink-soft mb-5 max-w-xl">
        Pre-filled applications for grants that match your work. Karuna injects your live numbers (cases handled,
        species count, partner network) into each template so you fill in only the story.
      </p>

      <div className="card bg-moss/10 border-moss/30 mb-5">
        <div className="display text-lg">Auto-filled from your data</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-sm">
          <Tile k="Cases handled" v={stats.data?.total ?? '–'} />
          <Tile k="Released MTD" v={stats.data?.released ?? '–'} />
          <Tile k="Active in care" v={stats.data?.inCare ?? '–'} />
          <Tile k="Cost MTD" v={`₹${((stats.data?.spendMTD ?? 0) / 1000).toFixed(1)}k`} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {GRANTS.map((g) => (
          <div key={g.name} className="card">
            <div className="flex justify-between items-start gap-2">
              <div className="display text-lg pr-2 leading-tight">{g.name}</div>
              <FitBadge fit={g.fit} />
            </div>
            <div className="text-sm text-ink-soft mt-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1"><Coins size={12} /> {g.amount}</span>
              <span className="inline-flex items-center gap-1"><FileText size={12} /> due {g.deadline}</span>
            </div>
            <div className="mt-4 flex gap-2 items-center">
              <button disabled title="Coming soon" className="btn-primary !text-xs opacity-60 cursor-not-allowed">
                Open pre-filled draft
              </button>
              <button disabled title="Coming soon" className="btn-ghost !text-xs opacity-60 cursor-not-allowed">
                <ExternalLink size={12} /> Source
              </button>
              <span className="text-[9px] font-mono uppercase tracking-widest text-ink-muted">Soon</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Tile({ k, v }: { k: string; v: number | string }) {
  return <div><div className="kicker">{k}</div><div className="display text-2xl mt-1">{v}</div></div>;
}

function FitBadge({ fit }: { fit: number }) {
  const pct = Math.round(fit * 100);
  const colour = fit >= 0.85 ? 'bg-moss/15 text-moss' : fit >= 0.7 ? 'bg-amber/15 text-amber' : 'bg-cream text-ink-soft';
  return <span className={`shrink-0 px-2 py-1 rounded-full ${colour} text-[10px] font-mono uppercase tracking-wider`}>{pct}% fit</span>;
}
