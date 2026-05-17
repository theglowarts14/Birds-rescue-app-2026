import { type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  LayoutGrid, FileText, Users, Building2, Stethoscope, Boxes,
  Map, GraduationCap, History, Sparkles, Coins, Settings,
} from 'lucide-react';

export function PageHeader({ kicker, title, accent, children }: {
  kicker?: string; title: ReactNode; accent?: ReactNode; children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap justify-between items-end gap-4 mb-5">
      <div>
        {kicker && <div className="kicker">{kicker}</div>}
        <h1 className="display text-3xl sm:text-4xl mt-1">
          {title} {accent && <em className="italic text-rust">{accent}</em>}
        </h1>
      </div>
      {children && <div className="flex gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="p-10 text-center bg-cream/60 rounded-2xl border border-dashed border-black/10">
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
      <div className={`display text-3xl mt-2 ${colour}`}>{value}</div>
      {sub && <div className="text-xs text-ink-soft mt-1">{sub}</div>}
    </div>
  );
}

const TEAM_NAV = [
  { to: 'team',           label: 'Overview',  icon: LayoutGrid, end: true },
  { to: 'team/cases',     label: 'Cases',     icon: FileText },
  { to: 'team/volunteers',label: 'Volunteers',icon: Users },
  { to: 'team/partners',  label: 'Partners',  icon: Building2 },
  { to: 'team/clinics',   label: 'Clinics',   icon: Stethoscope },
  { to: 'team/inventory', label: 'Inventory', icon: Boxes },
  { to: 'team/heatmap',   label: 'Heatmap',   icon: Map },
  { to: 'team/training',  label: 'Training',  icon: GraduationCap },
  { to: 'team/audit',     label: 'Audit',     icon: History },
  { to: 'team/impact',    label: 'Impact poster', icon: Sparkles },
  { to: 'team/grants',    label: 'Grants',    icon: Coins },
  { to: 'admin/settings', label: 'Settings',  icon: Settings },
] as const;

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

const DONOR_NAV = [
  { to: 'donate',          label: 'Give a thing' },
  { to: 'donate/sponsor',  label: 'Sponsor a case' },
  { to: 'donate/released', label: 'Released this month' },
  { to: 'donate/wall',     label: 'Recognition wall' },
  { to: 'donate/csr',      label: 'For companies' },
] as const;

export function DonorNav() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const loc = useLocation();
  return (
    <nav className="flex gap-1 flex-wrap mb-6">
      {DONOR_NAV.map((item) => {
        const path = `/${orgSlug}/${item.to}`;
        const active = item.to === 'donate'
          ? loc.pathname === `/${orgSlug}/donate`
          : loc.pathname.startsWith(path);
        return (
          <Link
            key={item.to}
            to={path}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              active ? 'bg-ink text-paper' : 'bg-cream text-ink-soft border border-black/10'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
