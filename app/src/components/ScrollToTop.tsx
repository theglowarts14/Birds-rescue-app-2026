import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router doesn't reset scroll position when navigating to a new route.
// This component watches the pathname and snaps the window back to the top
// on every navigation, so clicking a link from deep in a long list page
// (e.g. Cases → CaseDetail) lands on the new page's header, not wherever the
// previous page was scrolled.
//
// Hash navigation is preserved — if the URL has a #fragment, we leave scroll
// alone so deep links to a comment or section still work.

export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);

  return null;
}
