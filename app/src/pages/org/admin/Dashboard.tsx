import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  IndianRupee, Users, Sparkles, ShieldCheck, ArrowUpRight,
  Receipt, UserPlus, AlertTriangle, Clock, Award, Activity,
  Settings, BarChart3, Coins, ExternalLink, CheckCircle2,
} from 'lucide-react';
import { useOrg } from '../../../lib/org';
import { adminDashboard } from '../../../lib/queries';
import { PageHeader, LoadingRow, Stat } from '../../../components/ui';

export default function Dashboard() {
  const { org } = useOrg();
  const { orgSlug } = useParams();
  const orgId = org?.id;

  const q = useQuery({
    queryKey: ['admin-dashboard', orgId],
    queryFn: () => adminDashboard(orgId!),
    enabled: !!orgId,
    refetchInterval: 5 * 60_000,
  });

  const month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const d = q.data;

  const actionItems = useMemo(() => buildActionItems(d), [d]);

  return (
    <>
      <PageHeader kicker="Admin" title="Dashboard" accent="the owner's view.">
        <Link to={`/${orgSlug}/team/impact`} className="btn-ghost">
          <Sparkles size={14} /> Funder snapshot
        </Link>
        <Link to={`/${orgSlug}/admin/settings`} className="btn-primary">
          <Settings size={14} /> Settings
        </Link>
      </PageHeader>

      {q.isLoading && <LoadingRow />}

      {d && (
        <>
          <div className="card bg-gradient-to-br from-cream to-creamDeep mb-5">
            <div className="flex flex-wrap justify-between items-end gap-4">
              <div>
                <div className="kicker">{month} · health snapshot</div>
                <h2 className="display text-3xl mt-1">
                  {d.stories.releasedMtd > 0
                    ? <>You've released <em className="italic text-rust">{d.stories.releasedMtd}</em> {d.stories.releasedMtd === 1 ? 'animal' : 'animals'} this month.</>
                    : <>A quiet month so far. <em className="italic text-rust">Still time to make stories.</em></>}
                </h2>
                <p className="text-sm text-ink-soft mt-2">
                  ₹{d.money.paidMtd.toLocaleString('en-IN')} in donations · {d.team.total} members · {d.team.onShiftNow} on shift right now.
                </p>
              </div>
              {actionItems.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber/15 text-amber text-xs font-medium">
                  <AlertTriangle size={12} /> {actionItems.length} needs your attention
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat
              label="Donations this month"
              value={`₹${formatInr(d.money.paidMtd)}`}
              accent="moss"
              sub={momLabel(d.money.momChangePct, d.money.paidPrev)}
            />
            <Stat
              label="Recurring donors"
              value={d.money.recurringCount}
              accent={d.money.recurringCount > 0 ? 'sky' : undefined}
              sub={d.money.recurringCount > 0 ? 'auto-charge monthly' : 'none yet'}
            />
            <Stat
              label="Releases (this month)"
              value={d.stories.releasedMtd}
              accent="sky"
              sub={`${d.stories.cumulativeReleased} all-time`}
            />
            <Stat
              label="Avg accept rate"
              value={d.team.avgAcceptRate != null ? `${d.team.avgAcceptRate}%` : '—'}
              accent={d.team.avgAcceptRate == null ? undefined : d.team.avgAcceptRate >= 80 ? 'moss' : d.team.avgAcceptRate >= 50 ? 'amber' : 'rust'}
              sub={d.team.avgResponseSeconds ? `${Math.round(d.team.avgResponseSeconds / 60)}m avg response` : 'dispatches accepted'}
            />
          </div>

          {actionItems.length > 0 && (
            <section className="card mb-5 border-amber/40">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber" />
                <h3 className="display text-lg">Needs your <em className="italic text-amber">attention</em></h3>
              </div>
              <ul className="space-y-2">
                {actionItems.map((a) => (
                  <li key={a.key} className="grid grid-cols-[24px_1fr_auto] gap-3 items-center p-2.5 bg-amber/5 rounded-xl">
                    <a.Icon size={14} className={a.severity === 'high' ? 'text-rust' : 'text-amber'} />
                    <div className="min-w-0">
                      <div className="text-sm">{a.title}</div>
                      {a.hint && <div className="text-[11px] text-ink-soft mt-0.5">{a.hint}</div>}
                    </div>
                    {a.cta && (
                      <Link to={`/${orgSlug}${a.cta.href}`} className="text-xs text-rust font-semibold inline-flex items-center gap-1">
                        {a.cta.label} <ArrowUpRight size={11} />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <Panel
              icon={<IndianRupee size={14} className="text-moss" />}
              title="Money"
              accent="cash + receipts"
              link={{ to: `/${orgSlug}/donate`, label: 'Donor portal' }}
            >
              <RowKV label="This month" value={`₹${formatInr(d.money.paidMtd)}`} bold />
              <RowKV label="Last month" value={`₹${formatInr(d.money.paidPrev)}`} />
              <RowKV label="Average gift" value={`₹${formatInr(d.money.avgGiftInr)}`} />
              <RowKV label="Recurring donors" value={`${d.money.recurringCount}`} accent={d.money.recurringCount > 0 ? 'sky' : undefined} />
              <RowKV label="Sponsored cases" value={`${d.money.sponsorships}`} />
              {d.money.topProduct && (
                <RowKV
                  label="Top product"
                  value={
                    <span>
                      {d.money.topProduct.emoji ?? '🎁'} {d.money.topProduct.label}
                      <span className="text-ink-muted ml-2 font-mono text-[10px]">
                        ₹{formatInr(d.money.topProduct.total)} · {d.money.topProduct.count}×
                      </span>
                    </span>
                  }
                />
              )}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-black/5">
                <MiniReceipt label="Issued" value={d.money.receiptsIssued} color="text-moss" icon={<CheckCircle2 size={11} />} />
                <MiniReceipt label="Pending" value={d.money.receiptsPending} color={d.money.receiptsPending > 0 ? 'text-rust' : 'text-ink-soft'} icon={<Receipt size={11} />} />
              </div>
            </Panel>

            <Panel
              icon={<Users size={14} className="text-sky" />}
              title="Team"
              accent="people + readiness"
              link={{ to: `/${orgSlug}/admin/team`, label: 'Manage team' }}
            >
              <RowKV label="Total members" value={`${d.team.total}`} bold />
              <RowKV label="On shift right now" value={`${d.team.onShiftNow}`} accent={d.team.onShiftNow > 0 ? 'moss' : 'rust'} />
              <RowKV label="Pending invites" value={`${d.team.pendingInvites}`} accent={d.team.pendingInvites > 0 ? 'amber' : undefined} />
              <RowKV
                label="Inactive 14+ days"
                value={`${d.team.inactiveDays14}`}
                accent={d.team.inactiveDays14 > 0 ? 'amber' : undefined}
              />
              <div className="mt-3 pt-3 border-t border-black/5">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs text-ink-soft">Training completion</span>
                  <span className="font-mono text-xs">{d.team.trainingCompletionPct}%</span>
                </div>
                <div className="h-1.5 bg-cream rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      d.team.trainingCompletionPct >= 80 ? 'bg-moss' : d.team.trainingCompletionPct >= 50 ? 'bg-amber' : 'bg-rust'
                    }`}
                    style={{ width: `${d.team.trainingCompletionPct}%` }}
                  />
                </div>
              </div>
            </Panel>

            <Panel
              icon={<Sparkles size={14} className="text-rust" />}
              title="Stories"
              accent="the case for funders"
              link={{ to: `/${orgSlug}/team/impact`, label: 'Impact poster' }}
            >
              <RowKV label="Released this month" value={`${d.stories.releasedMtd}`} bold accent="sky" />
              <RowKV label="Released all-time" value={`${d.stories.cumulativeReleased}`} />
              <RowKV label="Donors on the wall" value={`${d.stories.recognitionOptIns}`} accent={d.stories.recognitionOptIns > 0 ? 'sky' : undefined} />
              <div className="mt-3 pt-3 border-t border-black/5 text-xs text-ink-soft leading-relaxed">
                Every release becomes a sky-blue card on the donor portal.
                Recognition opt-ins go on the wall.
              </div>
            </Panel>

            <Panel
              icon={<ShieldCheck size={14} className="text-moss" />}
              title="Compliance"
              accent="audit + records"
              link={{ to: `/${orgSlug}/team/audit`, label: 'Open audit log' }}
            >
              <RowKV label="Audit events (7d)" value={`${d.compliance.auditEventsThisWeek}`} bold />
              <RowKV
                label="Last audit event"
                value={d.compliance.lastAuditEventAt
                  ? `${d.compliance.lastAuditEventKind ?? '—'} · ${timeAgo(d.compliance.lastAuditEventAt)}`
                  : 'no events yet'}
              />
              <RowKV label="80G receipts issued" value={`${d.money.receiptsIssued}`} accent="moss" />
              <RowKV
                label="80G receipts pending"
                value={`${d.money.receiptsPending}`}
                accent={d.money.receiptsPending > 0 ? 'rust' : undefined}
              />
              <RowKV
                label="Email bounces"
                value={`${(d.money as any).receiptsEmailFailed ?? 0}`}
                accent={(d.money as any).receiptsEmailFailed > 0 ? 'amber' : undefined}
              />
              <div className="mt-3 pt-3 border-t border-black/5 text-[11px] text-ink-soft leading-relaxed">
                Receipts pending means a donation is paid but the PDF hasn't issued.
                Email bounces mean the PDF exists but Resend couldn't deliver — re-send from the audit page.
              </div>
            </Panel>
          </div>

          <section className="card">
            <div className="kicker mb-3">Quick actions</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <QuickAction to={`/${orgSlug}/admin/team`} icon={<UserPlus size={14} />} label="Invite member" />
              <QuickAction to={`/${orgSlug}/team/impact`} icon={<Sparkles size={14} />} label="Impact poster" />
              <QuickAction to={`/${orgSlug}/team/grants`} icon={<Coins size={14} />} label="Grant templates" />
              <QuickAction to={`/${orgSlug}/admin/settings`} icon={<Settings size={14} />} label="Org settings" />
            </div>
          </section>
        </>
      )}
    </>
  );
}

function Panel({ icon, title, accent, link, children }: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  link?: { to: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="display text-lg">{title} <em className="italic text-ink-soft text-xs not-italic font-normal ml-1">{accent}</em></h3>
        </div>
        {link && (
          <Link to={link.to} className="text-[11px] text-rust font-semibold inline-flex items-center gap-1">
            {link.label} <ArrowUpRight size={10} />
          </Link>
        )}
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function RowKV({ label, value, bold, accent }: {
  label: string; value: React.ReactNode; bold?: boolean;
  accent?: 'moss' | 'amber' | 'rust' | 'sky';
}) {
  const valueClass = accent ? `text-${accent}` : 'text-ink';
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-ink-soft">{label}</span>
      <span className={`text-sm ${bold ? 'font-semibold' : ''} ${valueClass}`}>{value}</span>
    </div>
  );
}

function MiniReceipt({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className={color}>{icon}</span>
      <span className="text-ink-soft">{label}</span>
      <span className={`ml-auto font-mono ${color}`}>{value}</span>
    </div>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 p-3 rounded-xl bg-cream/60 hover:bg-cream transition text-sm">
      <span className="text-rust">{icon}</span>
      <span className="truncate">{label}</span>
      <ExternalLink size={10} className="ml-auto text-ink-soft" />
    </Link>
  );
}

type Severity = 'low' | 'med' | 'high';
interface ActionItem {
  key: string;
  title: string;
  hint?: string;
  severity: Severity;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  cta?: { href: string; label: string };
}

function buildActionItems(d: DashboardData | undefined): ActionItem[] {
  if (!d) return [];
  const items: ActionItem[] = [];

  if (d.money.receiptsPending > 0) {
    items.push({
      key: 'receipts',
      title: `${d.money.receiptsPending} 80G receipt${d.money.receiptsPending === 1 ? '' : 's'} pending`,
      hint: 'Donations marked paid but no PDF issued yet — typically resolved by the next webhook retry.',
      severity: 'high',
      Icon: Receipt,
      cta: { href: '/team/audit', label: 'Audit' },
    });
  }

  if ((d.money as any).receiptsEmailFailed > 0) {
    items.push({
      key: 'receipt-email-failed',
      title: `${(d.money as any).receiptsEmailFailed} receipt email${(d.money as any).receiptsEmailFailed === 1 ? '' : 's'} bounced`,
      hint: 'PDF is in Storage but Resend failed to deliver. Re-send via the audit page or check donor email.',
      severity: 'med',
      Icon: Receipt,
      cta: { href: '/team/audit', label: 'Audit' },
    });
  }

  if (d.team.pendingInvites > 0) {
    items.push({
      key: 'invites',
      title: `${d.team.pendingInvites} invitee${d.team.pendingInvites === 1 ? '' : 's'} haven't signed in`,
      hint: 'They got the OTP. A nudge usually closes this.',
      severity: 'med',
      Icon: UserPlus,
      cta: { href: '/admin/team', label: 'Team' },
    });
  }

  if (d.team.inactiveDays14 > 0) {
    items.push({
      key: 'inactive',
      title: `${d.team.inactiveDays14} member${d.team.inactiveDays14 === 1 ? '' : 's'} inactive 14+ days`,
      hint: 'No events logged in two weeks. Worth a check-in.',
      severity: 'low',
      Icon: Clock,
      cta: { href: '/team/volunteers', label: 'Roster' },
    });
  }

  if (d.team.trainingCompletionPct < 60 && d.team.total > 1) {
    items.push({
      key: 'training',
      title: `Training completion at ${d.team.trainingCompletionPct}%`,
      hint: 'Field rescuers can\'t be auto-dispatched until they finish core modules.',
      severity: d.team.trainingCompletionPct < 30 ? 'high' : 'med',
      Icon: Award,
      cta: { href: '/team/training', label: 'Training' },
    });
  }

  if (d.team.onShiftNow === 0 && isBusinessHours()) {
    items.push({
      key: 'no-shift',
      title: 'No one is on shift right now',
      hint: 'Coordinators will see incoming cases but auto-dispatch won\'t fire.',
      severity: 'high',
      Icon: Activity,
      cta: { href: '/team/shifts', label: 'Shifts' },
    });
  }

  if (d.team.avgAcceptRate != null && d.team.avgAcceptRate < 50) {
    items.push({
      key: 'accept-rate',
      title: `Org-wide accept rate ${d.team.avgAcceptRate}%`,
      hint: 'Volunteers are declining or missing dispatches. Talk to the team.',
      severity: 'med',
      Icon: BarChart3,
      cta: { href: '/team/volunteers', label: 'Roster' },
    });
  }

  return items.sort((a, b) => sev(b.severity) - sev(a.severity));
}

const sev = (s: Severity) => (s === 'high' ? 3 : s === 'med' ? 2 : 1);

function isBusinessHours(): boolean {
  const h = new Date().getHours();
  return h >= 8 && h < 20;
}

function formatInr(n: number): string {
  return n.toLocaleString('en-IN');
}

function momLabel(pct: number | null, prev: number): string {
  if (prev === 0) return 'first month with donations';
  if (pct == null) return '';
  if (pct >= 0) return `↑ ${pct}% vs last month`;
  return `↓ ${Math.abs(pct)}% vs last month`;
}

function timeAgo(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

type DashboardData = Awaited<ReturnType<typeof adminDashboard>>;
