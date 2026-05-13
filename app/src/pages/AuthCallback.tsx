import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const DEV_ORG = import.meta.env.VITE_DEV_ORG_SLUG || 'awcs';

export default function AuthCallback() {
  const nav = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      nav(data.session ? `/${DEV_ORG}/team` : '/login', { replace: true });
    });
  }, [nav]);
  return (
    <main className="min-h-screen grid place-items-center text-ink-muted text-sm">
      Signing you in…
    </main>
  );
}
