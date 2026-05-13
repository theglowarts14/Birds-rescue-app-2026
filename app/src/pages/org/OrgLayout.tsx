import { Outlet, Link, useLocation, useParams } from 'react-router-dom';
import { useOrg } from '../../lib/org';
import { useAuth } from '../../lib/auth';

export default function OrgLayout() {
  const { org, loading, error } = useOrg();
  const { user } = useAuth();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const loc = useLocation();
  const isTeam = loc.pathname.includes('/team');

  if (loading) return <main className="min-h-screen grid place-items-center text-ink-muted">Loading…</main>;
  if (error || !org) return (
    <main className="min-h-screen grid place-items-center">
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
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-black/10">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-7 py-3 flex items-center gap-4">
          <Link to={`/${orgSlug}`} className="flex items-center gap-2">
            <span className="text-2xl">🪶</span>
            <span className="display font-semibold text-xl">
              {isTeam ? 'Karuna' : org.public_name || org.name}
            </span>
            {!isTeam && org.founded_year && (
              <span className="hidden sm:inline italic text-xs text-ink-muted ml-1 mt-1.5">· est. {org.founded_year}</span>
            )}
          </Link>
          <nav className="ml-auto flex gap-1 bg-cream rounded-full p-1 border border-black/10">
            <Link to={`/${orgSlug}/donate`} className={`px-4 py-1.5 rounded-full text-xs font-medium ${!isTeam ? 'bg-ink text-paper' : 'text-ink-soft'}`}>Donate</Link>
            <Link to={`/${orgSlug}/team`} className={`px-4 py-1.5 rounded-full text-xs font-medium ${isTeam ? 'bg-ink text-paper' : 'text-ink-soft'}`}>Team ops</Link>
          </nav>
          {user ? <span className="text-xs text-ink-muted hidden md:inline">{user.phone ?? user.email}</span> : <Link to="/login" className="btn-ghost text-xs">Sign in</Link>}
        </div>
      </header>
      <div className="flex-1"><Outlet /></div>
    </div>
  );
}
