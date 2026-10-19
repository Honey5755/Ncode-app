import { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { firstAdminRoute } from './components/adminNav';
import Layout from './components/Layout';
import { PageSkeleton } from './components/LoadingSkeleton';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserDetailsPage from './pages/admin/UserDetailsPage';
import { AdminChangePasswordPage, ChangePasswordPage, RolesPage, UsersPage } from './pages/admin/UserManagementPages';
import { SETUP_PAGES } from './pages/admin/setup/masterConfigs';
import MasterPage from './pages/admin/setup/MasterPage';
import UserDashboard from './pages/user/UserDashboard';
import { can } from './services/permissions';
import type { Role, ScreenKey } from './types';

/** UI-level routing only. Real authorization is enforced by the backend on every API call. */
function RequireRole({ role, screen, children }: { role: Role | Role[]; screen?: ScreenKey; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageSkeleton />;
  if (!user) return <Navigate to="/login" replace />;
  const allowed = Array.isArray(role) ? role.includes(user.role) : user.role === role;
  if (!allowed) return <Navigate to={user.role === 'USER' ? '/' : '/admin'} replace />;
  if (screen && !can(user, screen)) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

/** /admin → the first page this user's role lets them view. */
function AdminHome() {
  const { user } = useAuth();
  const first = firstAdminRoute(user);
  if (first) return <Navigate to={first} replace />;
  return (
    <Layout title="No access assigned yet">
      <div className="card max-w-xl space-y-2">
        <h2 className="font-bold text-slate-900">No access assigned yet</h2>
        <p className="text-sm text-slate-600">
          Your account has no portal screens yet — ask an administrator to assign you a role.
        </p>
      </div>
    </Layout>
  );
}

const PORTAL: Role[] = ['ADMIN', 'MANAGER'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<RequireRole role="USER"><UserDashboard /></RequireRole>} />
      <Route path="/admin" element={<RequireRole role={PORTAL}><AdminHome /></RequireRole>} />
      <Route path="/admin/:tab" element={<RequireRole role={PORTAL}><AdminDashboard /></RequireRole>} />
      <Route path="/admin/users/:id" element={<RequireRole role={PORTAL} screen="user_management.user"><UserDetailsPage /></RequireRole>} />
      {Object.entries(SETUP_PAGES).map(([slug, config]) => (
        <Route
          key={slug}
          path={`/admin/setup/${slug}`}
          element={<RequireRole role={PORTAL} screen={config.screen}><MasterPage key={slug} config={config} /></RequireRole>}
        />
      ))}
      <Route path="/admin/user-management/roles" element={<RequireRole role={PORTAL} screen="user_management.role"><RolesPage /></RequireRole>} />
      <Route path="/admin/user-management/users" element={<RequireRole role={PORTAL} screen="user_management.user"><UsersPage /></RequireRole>} />
      <Route path="/admin/user-management/reset-password" element={<RequireRole role={PORTAL} screen="user_management.admin_change_password"><AdminChangePasswordPage /></RequireRole>} />
      <Route path="/admin/change-password" element={<RequireRole role={PORTAL}><ChangePasswordPage /></RequireRole>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
