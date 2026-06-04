import { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AppShell } from '@/components/layout/AppShell';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Accounts from '@/pages/Accounts';
import AccountDetail from '@/pages/AccountDetail';
import Tickets from '@/pages/Tickets';
import Renewals from '@/pages/Renewals';
import Releases from '@/pages/Releases';
import ProspectNew from '@/pages/ProspectNew';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminZones from '@/pages/admin/AdminZones';
import AdminReleases from '@/pages/admin/AdminReleases';
import PRISMPrioritization from '@/pages/PRISMPrioritization';
import PRISMMarketResearch from '@/pages/PRISMMarketResearch';
import NotFound from '@/pages/NotFound';

function AuthGuard({ requireAdmin = false }: { requireAdmin?: boolean }) {
  const { accessToken, role, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // token presence is enough — JWT is validated server-side per request
  }, [accessToken]);

  if (!isAuthenticated || !accessToken) return <Navigate to="/login" replace />;

  if (requireAdmin && role !== 'matrix_manager') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route element={<AuthGuard />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/:accountId" element={<AccountDetail />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/renewals" element={<Renewals />} />
          <Route path="/releases" element={<Releases />} />
          <Route path="/prospect" element={<ProspectNew />} />
          <Route path="/prism/prioritization" element={<PRISMPrioritization />} />
          <Route path="/prism/market-research" element={<PRISMMarketResearch />} />

          {/* Admin only */}
          <Route element={<AuthGuard requireAdmin />}>
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/zones" element={<AdminZones />} />
            <Route path="/admin/releases" element={<AdminReleases />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
