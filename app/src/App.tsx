import { Routes, Route, Navigate } from 'react-router-dom';
import { OrgProvider } from './lib/org';
import { ScrollToTop } from './components/ScrollToTop';

import Landing from './pages/Landing';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Onboarding from './pages/Onboarding';

import OrgLayout from './pages/org/OrgLayout';
import TeamLayout from './pages/org/team/TeamLayout';

import Overview from './pages/org/team/Overview';
import Cases from './pages/org/team/Cases';
import CaseDetail from './pages/org/team/CaseDetail';
import Volunteers from './pages/org/team/Volunteers';
import VolunteerProfile from './pages/org/team/VolunteerProfile';
import Shifts from './pages/org/team/Shifts';
import Partners from './pages/org/team/Partners';
import Clinics from './pages/org/team/Clinics';
import Inventory from './pages/org/team/Inventory';
import Heatmap from './pages/org/team/Heatmap';
import Training from './pages/org/team/Training';
import Audit from './pages/org/team/Audit';
import ImpactPoster from './pages/org/team/ImpactPoster';
import Grants from './pages/org/team/Grants';
import Settings from './pages/org/admin/Settings';
import Team from './pages/org/admin/Team';
import Dashboard from './pages/org/admin/Dashboard';

import Portal from './pages/org/donate/Portal';
import Sponsor from './pages/org/donate/Sponsor';
import Released from './pages/org/donate/Released';
import Wall from './pages/org/donate/Wall';
import CSR from './pages/org/donate/CSR';

import Report from './pages/public/Report';
import Education from './pages/public/Education';

const DEV_ORG = import.meta.env.VITE_DEV_ORG_SLUG || 'awcs';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={<Onboarding />} />

        <Route path="/:orgSlug" element={<OrgProvider><OrgLayout /></OrgProvider>}>
          <Route index element={<Navigate to="donate" replace />} />

          {/* Donor */}
          <Route path="donate"          element={<Portal />} />
          <Route path="donate/sponsor"  element={<Sponsor />} />
          <Route path="donate/released" element={<Released />} />
          <Route path="donate/wall"     element={<Wall />} />
          <Route path="donate/csr"      element={<CSR />} />

          {/* Public */}
          <Route path="edu" element={<Education />} />

          {/* Team ops + admin share the sidebar */}
          <Route element={<TeamLayout />}>
            <Route path="team"                  element={<Overview />} />
            <Route path="team/cases"            element={<Cases />} />
            <Route path="team/cases/:caseId"    element={<CaseDetail />} />
            <Route path="team/volunteers"       element={<Volunteers />} />
            <Route path="team/volunteers/:userId" element={<VolunteerProfile />} />
            <Route path="team/shifts"           element={<Shifts />} />
            <Route path="team/partners"         element={<Partners />} />
            <Route path="team/clinics"          element={<Clinics />} />
            <Route path="team/inventory"        element={<Inventory />} />
            <Route path="team/heatmap"          element={<Heatmap />} />
            <Route path="team/training"         element={<Training />} />
            <Route path="team/audit"            element={<Audit />} />
            <Route path="team/impact"           element={<ImpactPoster />} />
            <Route path="team/grants"           element={<Grants />} />
            <Route path="admin"                 element={<Navigate to="dashboard" replace />} />
            <Route path="admin/dashboard"       element={<Dashboard />} />
            <Route path="admin/settings"        element={<Settings />} />
            <Route path="admin/team"            element={<Team />} />
          </Route>
        </Route>

        {/* Reporter web flow lives outside OrgLayout chrome — full screen */}
        <Route path="/:orgSlug/r" element={<OrgProvider><Report /></OrgProvider>} />

        <Route path="/team"   element={<Navigate to={`/${DEV_ORG}/team`} replace />} />
        <Route path="/donate" element={<Navigate to={`/${DEV_ORG}/donate`} replace />} />
        <Route path="*"       element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
