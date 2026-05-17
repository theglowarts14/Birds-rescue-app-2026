import { useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  LayoutGrid, FileText, Users, Building2, Stethoscope, Boxes,
  Map, GraduationCap, History, Sparkles, Coins, Settings, Menu, X,
} from 'lucide-react';

export function PageHeader({ kicker, title, accent, children }: {
  kicker?: string; title: ReactNode; accent?: ReactNode; children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap justify-between items-end gap-4 mb-5">
      <div>
        {kicker && <div className="kicker">{kicker}</div>}
        <h1 className="display text-2xl sm:text-3xl md:text-4xl mt-1">
          {title} {accent && <em className="italic text-rust">{accent}</em>}
        </h1>
      </div>
      {children && <div className="flex gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="p-8 sm:p-10 text-center bg-cream/60 rounded-2xl border border-dashed border-black/10">
      {icon && <div className="text-3xl mb-3">{icon}</div>}
      <div className="display text-lg">{title}</div>
      {hint && <p className="text-sm text-ink-soft mt-1">{hint}</p>}
    </div>
  );
}

export function LoadingRow() {
  return <div className="p-8 text-center text-ink-muted text-sm">Loading…</div>;
}

export function ErrorRow({ err }: { err: unknown }) {
  return (
    <div className="p-6 rounded-xl bg-rust/10 text-rust text-sm">
      Couldn't load. {(err as Error)?.message ?? 'Check RLS policies and env vars.'}
    </div>
  );
}

export function Stat({ label, value, sub, accent }: {
  label: string; value: ReactNode; sub?: string; accent?: 'rust' | 'moss' | 'amber' | 'sky';
}) {
  const colour = accent ? `text-${accent}` : 'text-ink';
  return (
    <div className="card">
      <div className="kicker">{label}</div>
      <div className={`display text-2xl sm:text-3xl mt-2 ${colour}`}>{value}</div>
      {sub && <div className="text-[11px] sm:text-xs text-ink-soft mt-1">{sub}</div>}
    </div>
  );
}

const TEAM_NAV = [
  { to: 'team',           label: 'Overview',  short: 'Home',  icon: LayoutGrid, end: true },
  { to: 'team/cases',     label: 'Cases',     short: 'Cases', icon: FileText },
  { to: 'team/volunteers',label: 'Volunteers',short: 'Team',  icon: Users },
  { to: 'team/partners',  label: 'Partners',  icon: Building2 },
  { to: 'team/clinics',   label: 'Clinics',   icon: Stethoscope },
  { to: 'team/inventory', label: 'Inventory', icon: Boxes },
  { to: 'team/heatmap',   label: 'Heatmap',   icon: Map },
  { to: 'team/training',  label: 'Training',  icon: GraduationCap },
  { to: 'team/audit',     label: 'Audit',     icon: History },
  { to: 'team/impact',    label: 'Impact',    icon: Sparkles },
  { to: 'team/grants',    label: 'Grants',    icon: Coins },
  { to: 'admin/settings', label: 'Settings',  icon: Settings },
] as const;

const MOBILE_TABS = TEAM_NAV.slice(0, 3);
const MORE_ITEMS  = TEAM_NAV.slice(3);

export function TeamSidebar() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const loc = useLocation();
  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-[68px] self-start py-6">
      <div className="kicker px-3 mb-3">Karuna ops</div>
      <nav className="space-y-0.5">
        {TEAM_NAV.map((item) => {
          const path = `/${orgSlug}/${item.to}`;
          const active = item.end ? loc.pathname === path : loc.pathname.startsWith(path);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                active ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-cream'
              }`}
            >
              <Icon size={15} /> {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileTabBar() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const loc = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_ITEMS.some((i) => loc.pathname.startsWith(`/${orgSlug}/${i.to}`));

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-paper border-t border-black/10 grid grid-cols-4"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {MOBILE_TABS.map((item) => {
          const path = `/${orgSlug}/${item.to}`;
          const active = item.end ? loc.pathname === path : loc.pathname.startsWith(path);
          const Icon = item.icon;
          return (
            <Link key={item.to} to={path} className={`flex flex-col items-center justify-center gap-1 py-2.5 ${active ? 'text-rust' : 'text-ink-soft'}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              <span className="text-[10px] font-mono uppercase tracking-wider">{item.short ?? item.label}</span>
            </Link>
          );
        })}
        <button onClick={() => setMoreOpen(true)} className={`flex flex-col items-center justify-center gap-1 py-2.5 ${isMoreActive ? 'text-rust' : 'text-ink-soft'}`}>
          <Menu size={20} strokeWidth={isMoreActive ? 2.5 : 1.75} />
          <span className="text-[10px] font-mono uppercase tracking-wider">More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-ink/40 animate-fade-in" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-paper rounded-t-3xl shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex items-center justify-between p-5 border-b border-black/5">
              <div>
                <div className="kicker">Karuna ops</div>
                <h2 className="display text-2xl mt-1">More</h2>
              </div>
              <button onClick={() => setMoreOpen(false)} className="p-2 -mr-2"><X size={20} /></button>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {MORE_ITEMS.map((item) => {
                const path = `/${orgSlug}/${item.to}`;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={path}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-cream/60 hover:bg-cream"
                  >
                    <Icon size={18} className="text-rust" />
                    <span className="display">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const DONOR_NAV = [
  { to: 'donate',          label: 'Give a thing' },
  { to: 'donate/sponsor',  label: 'Sponsor a case' },
  { to: 'donate/released', label: 'Released' },
  { to: 'donate/wall',     label: 'Recognition' },
  { to: 'donate/csr',      label: 'For companies' },
] as const;

export function DonorNav() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const loc = useLocation();
  return (
    <nav className="-mx-4 sm:mx-0 px-4 sm:px-0 mb-6 overflow-x-auto scrollbar-none">
      <div className="flex gap-1 w-max sm:w-auto sm:flex-wrap">
        {DONOR_NAV.map((item) => {
          const path = `/${orgSlug}/${item.to}`;
          const active = item.to === 'donate'
            ? loc.pathname === `/${orgSlug}/donate`
            : loc.pathname.startsWith(path);
          return (
            <Link
              key={item.to}
              to={path}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                active ? 'bg-ink text-paper' : 'bg-cream text-ink-soft border border-black/10'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
