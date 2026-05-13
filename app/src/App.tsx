import { Routes, Route, Navigate } from 'react-router-dom';
import { OrgProvider } from './lib/org';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import OrgLayout from './pages/org/OrgLayout';
import TeamCases from './pages/org/team/Cases';
import TeamOverview from './pages/org/team/Overview';
import DonorPortal from './pages/org/donate/Portal';

const DEV_ORG = import.meta.env.VITE_DEV_ORG_SLUG || 'awcs';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/:orgSlug" element={<OrgProvider><OrgLayout /></OrgProvider>}>
        <Route index element={<Navigate to="donate" replace />} />
        <Route path="donate" element={<DonorPortal />} />
        <Route path="team" element={<TeamOverview />} />
        <Route path="team/cases" element={<TeamCases />} />
      </Route>

      <Route path="/team" element={<Navigate to={`/${DEV_ORG}/team`} replace />} />
      <Route path="/donate" element={<Navigate to={`/${DEV_ORG}/donate`} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
