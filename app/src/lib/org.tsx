import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from './supabase';
import type { Organization } from './database.types';

interface OrgState {
  org: Organization | null;
  loading: boolean;
  error: string | null;
}

const OrgCtx = createContext<OrgState | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [state, setState] = useState<OrgState>({ org: null, loading: true, error: null });

  useEffect(() => {
    if (!orgSlug) {
      setState({ org: null, loading: false, error: 'No org slug in URL' });
      return;
    }
    let alive = true;
    supabase
      .from('organizations')
      .select('*')
      .eq('slug', orgSlug)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error || !data) {
          setState({ org: null, loading: false, error: error?.message ?? `Organization "${orgSlug}" not found` });
          return;
        }
        setState({ org: data, loading: false, error: null });
        if (data.brand_primary) {
          document.documentElement.style.setProperty('--org-primary', data.brand_primary);
        }
      });
    return () => { alive = false; };
  }, [orgSlug]);

  return <OrgCtx.Provider value={state}>{children}</OrgCtx.Provider>;
}

export function useOrg() {
  const ctx = useContext(OrgCtx);
  if (!ctx) throw new Error('useOrg must be used inside <OrgProvider>');
  return ctx;
}
