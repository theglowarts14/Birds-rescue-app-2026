import { useState } from 'react';
import { Outlet, Link, useLocation, useParams } from 'react-router-dom';
import { useOrg } from '../../lib/org';
import { useAuth } from '../../lib/auth';
import { Menu, X, LogOut } from 'lucide-react';

export default function OrgLayout() {
  const { org, loading, error } = useOrg();
  const { user, signOut } = useAuth();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const loc = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isTeam = loc.pathname.includes('/team') || loc.pathname.includes('/admin');

  if (loading) return <main className="min-h-screen grid place-items-center text-ink-muted">Loading…</main>;
  if (error || !org) return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="card text-center max-w-sm">
        <div className="kicker">404</div>
        <h2 className="display text-2xl mt-2">Organization not found</h2>
        <p className="text-sm text-ink-soft mt-2">{error}</p>
        <Link to="/" className="btn-primary mt-4">Back home</Link>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-black/10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-7 py-3 flex items-center gap-3 sm:gap-4">
          <Link to={`/${orgSlug}`} className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">🪶</span>
            <span className="display font-semibold text-lg sm:text-xl truncate">
              {isTeam ? 'Karuna' : org.public_name || org.name}
            </span>
            {!isTeam && org.founded_year && (
              <span className="hidden sm:inline italic text-xs text-ink-muted ml-1 mt-1.5">
                · est. {org.founded_year}
              </span>
            )}
          </Link>

          <nav className="ml-auto hidden sm:flex gap-1 bg-cream rounded-full p-1 border border-black/10">
            <Link to={`/${orgSlug}/donate`} className={`px-4 py-1.5 rounded-full text-xs font-medium ${!isTeam ? 'bg-ink text-paper' : 'text-ink-soft'}`}>Donate</Link>
            <Link to={`/${orgSlug}/team`} className={`px-4 py-1.5 rounded-full text-xs font-medium ${isTeam ? 'bg-ink text-paper' : 'text-ink-soft'}`}>Team ops</Link>
          </nav>

          {user ? (
            <span className="text-xs text-ink-muted hidden md:inline truncate max-w-[140px]">{user.phone ?? user.email}</span>
          ) : (
            <Link to="/login" className="btn-ghost text-xs hidden sm:inline-flex">Sign in</Link>
          )}

          <button
            onClick={() => setDrawerOpen(true)}
            className="sm:hidden ml-auto p-2 -mr-2 text-ink"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {drawerOpen && (
        <div className="sm:hidden fixed inset-0 z-40 flex" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-ink/40 animate-fade-in" />
          <div onClick={(e) => e.stopPropagation()} className="relative ml-auto w-72 max-w-[85vw] h-full bg-paper shadow-2xl animate-slide-up p-5 flex flex-col" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.25rem)' }}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="kicker">{org.public_name ?? org.name}</div>
                <div className="display text-xl mt-1">Menu</div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 -mr-2"><X size={20} /></button>
            </div>
            <nav className="space-y-1">
              <DrawerLink to={`/${orgSlug}/donate`} active={!isTeam} onClick={() => setDrawerOpen(false)}>Donor portal</DrawerLink>
              <DrawerLink to={`/${orgSlug}/team`} active={isTeam} onClick={() => setDrawerOpen(false)}>Team ops</DrawerLink>
              <DrawerLink to={`/${orgSlug}/edu`} onClick={() => setDrawerOpen(false)}>Field guide</DrawerLink>
              <DrawerLink to={`/${orgSlug}/r`} onClick={() => setDrawerOpen(false)}>Report a rescue</DrawerLink>
            </nav>
            {user ? (
              <button
                onClick={() => { signOut(); setDrawerOpen(false); }}
                className="mt-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink-soft hover:bg-cream"
              >
                <LogOut size={14} /> Sign out · {user.phone ?? user.email}
              </button>
            ) : (
              <Link to="/login" onClick={() => setDrawerOpen(false)} className="btn-primary mt-auto justify-center">Sign in</Link>
            )}
          </div>
        </div>
      )}

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}

function DrawerLink({ to, active, onClick, children }: { to: string; active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-3 py-3 rounded-xl text-sm font-medium ${active ? 'bg-ink text-paper' : 'text-ink hover:bg-cream'}`}
    >
      {children}
    </Link>
  );
}
