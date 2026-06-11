import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicRoute } from '../features/auth/guards/PublicRoute';
import { ProtectedRoute } from '../features/auth/guards/ProtectedRoute';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { SignupPage } from '../features/auth/pages/SignupPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage';
import { PendingApprovalPage } from '../features/auth/pages/PendingApprovalPage';
import { useAuth } from '../features/auth/hooks/useAuth';
import { adminRoutes } from '../features/admin/routes';
import { adherentRoutes } from '../features/adherent/routes';
import { treasurerRoutes } from '../features/treasurer/routes';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin', 'treasurer', 'adherent']} />}>
        <Route path="/profile" element={<ProfileRedirect />} />
      </Route>

      {adminRoutes}
      {treasurerRoutes}
      {adherentRoutes}

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function ProfileRedirect() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <Navigate to="/admin/profile" replace />;
  }
  if (user?.role === 'treasurer') {
    return <Navigate to="/treasurer/profile" replace />;
  }
  return <Navigate to="/adherent/profile" replace />;
}

function UnauthorizedPage() {
  return (
    <div className="unauthorized-page">
      <h1>403</h1>
      <h2>Access Denied</h2>
      <p>
        You don&apos;t have permission to access this page.
      </p>
      <a href="/login">
        Go to Sign In
      </a>
    </div>
  );
}
