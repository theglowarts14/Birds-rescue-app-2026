import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useOrg } from '../../../lib/org';
import { dashboardStats, listCases, listIncoming } from '../../../lib/queries';
import { ArrowUpRight, TrendingUp, Activity, MapPin, Phone } from 'lucide-react';
import { Stat, LoadingRow, EmptyState } from '../../../components/ui';
import { WhosOnNow } from '../../../components/WhosOnNow';

export default function Overview() {
  const { org } = useOrg();
  const { orgSlug } = useParams();
  const orgId = org?.id;

  const stats    = useQuery({ queryKey: ['stats', orgId],    queryFn: () => dashboardStats(orgId!),    enabled: !!orgId });
  const critical = useQuery({ queryKey: ['critical', orgId], queryFn: () => listCases(orgId!, { status: 'critical' }), enabled: !!orgId });
  const incoming = useQuery({ queryKey: ['incoming', orgId], queryFn: () => listIncoming(orgId!),    enabled: !!orgId });

  return (
    <>
      <div className="card bg-gradient-to-br from-cream to-creamDeep flex flex-wrap gap-4 items-center justify-between mb-5">
        <div>
          <div className="kicker">Today · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <div className="display text-2xl mt-1">Karuna ops · <em className="italic text-rust">{org?.public_name ?? org?.name}</em></div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="px-3 py-1.5 rounded-full bg-rust/10 text-rust text-xs font-semibold">☀️ Heat advisory · live</span>
          <span className="px-3 py-1.5 rounded-full bg-amber/15 text-amber text-xs font-semibold">🪶 May drive · day 23</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Active"   value={stats.data?.active ?? '–'}   sub="cases open"        />
        <Stat label="Critical" value={stats.data?.critical ?? '–'} sub="need eyes now"     accent="rust" />
        <Stat label="In care"  value={stats.data?.inCare ?? '–'}   sub="clinic + fosters"  accent="amber" />
        <Stat label="Released" value={stats.data?.released ?? '–'} sub="this month"        accent="sky" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_320px] gap-4">
        <section className="card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="display text-xl">Critical right <em className="italic text-rust">now</em></h3>
            <Link to={`/${orgSlug}/team/cases`} className="text-xs text-rust font-semibold inline-flex items-center gap-1">
              All cases <ArrowUpRight size={12} />
            </Link>
          </div>
          {critical.isLoading && <LoadingRow />}
          {!critical.isLoading && (critical.data?.length ?? 0) === 0 && (
            <EmptyState icon="🪶" title="No critical cases" hint="Quiet shift — for now." />
          )}
          <ul className="space-y-2">
            {critical.data?.map((c) => (
              <li key={c.id}>
                <Link to={`/${orgSlug}/team/cases/${c.id}`} className="grid grid-cols-[36px_1fr_auto] gap-3 items-center p-3 bg-rust/10 rounded-xl border border-rust/30 hover:bg-rust/15 transition">
                  <span className="text-2xl">{c.species_emoji ?? '🪶'}</span>
                  <div className="min-w-0">
                    <div className="flex gap-2 items-center">
                      <span className="font-mono text-[11px] text-rust font-bold">{c.short_id}</span>
                      <span className="display font-medium truncate">{c.species_name ?? c.species_freetext ?? c.kind}</span>
                    </div>
                    <div className="text-xs text-ink-soft truncate">{c.threat_summary} · {c.area}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-rust">{new Date(c.received_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="display text-xl">Incoming triage <em className="italic text-amber">queue</em></h3>
            <span className="kicker">{incoming.data?.length ?? 0} WAITING</span>
          </div>
          {incoming.isLoading && <LoadingRow />}
          {!incoming.isLoading && (incoming.data?.length ?? 0) === 0 && (
            <EmptyState title="Inbox is clear." />
          )}
          <ul className="space-y-2">
            {incoming.data?.map((i: any) => (
              <li key={i.id} className="grid grid-cols-[80px_1fr_auto] gap-3 items-center p-3 bg-cream rounded-xl text-sm">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase text-moss">
                  {i.source === 'call' ? <Phone size={11} /> : '💬'} {i.source}
                </span>
                <div className="min-w-0">
                  <div className="truncate">{i.raw_text}</div>
                  <div className="text-[11px] text-ink-muted"><MapPin size={9} className="inline mr-1" />{i.auto_area} · {i.from_e164}</div>
                </div>
                <button className="btn-primary !py-2 !px-3 !text-xs">Accept</button>
              </li>
            ))}
          </ul>
        </section>

        <WhosOnNow />
      </div>

      <div className="mt-6 text-xs text-ink-muted">
        <Activity size={12} className="inline mr-1" /> Live via Supabase Realtime once subscriptions are wired. <TrendingUp size={12} className="inline mx-1" /> MTD spend: ₹{(stats.data?.spendMTD ?? 0).toLocaleString('en-IN')}.
      </div>
    </>
  );
}
