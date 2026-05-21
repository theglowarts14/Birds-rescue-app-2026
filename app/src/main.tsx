import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './lib/auth';
import { initSentry, ErrorBoundary } from './lib/sentry';
import { RealtimeToast } from './components/RealtimeToast';
import './index.css';

initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<FatalScreen />}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
            <RealtimeToast />
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);

function FatalScreen() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#faf6ef', color: '#1a1410' }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Inter, system-ui', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#7a6e60' }}>Something broke</div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia', fontSize: 32, marginTop: 8 }}>We're sorry — reload to try again.</h1>
        <p style={{ color: '#4a3f35', marginTop: 8 }}>The error has been logged. If this keeps happening, call the helpline at <strong>+91 96978 87888</strong>.</p>
        <button onClick={() => location.reload()} style={{ marginTop: 16, padding: '12px 24px', background: '#c44a1a', color: '#faf6ef', border: 0, borderRadius: 999, fontWeight: 600 }}>Reload</button>
      </div>
    </main>
  );
}
