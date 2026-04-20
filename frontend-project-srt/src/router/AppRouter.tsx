/* ============================================
   AppRouter — Central Route Definitions
   ============================================ */

import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicRoute } from '../features/auth/guards/PublicRoute';
import { ProtectedRoute } from '../features/auth/guards/ProtectedRoute';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { SignupPage } from '../features/auth/pages/SignupPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage';
import { AdminDashboard } from '../pages/dashboards/AdminDashboard';
import { TreasurerDashboard } from '../pages/dashboards/TreasurerDashboard';
import { ManagerDashboard } from '../pages/dashboards/ManagerDashboard';
import { AdherentDashboard } from '../pages/dashboards/AdherentDashboard';

export function AppRouter() {
  return (
    <Routes>
      {/* ---- Public Routes (auth pages) ---- */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* ---- Protected Routes: Admin ---- */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>

      {/* ---- Protected Routes: Treasurer ---- */}
      <Route element={<ProtectedRoute allowedRoles={['treasurer']} />}>
        <Route path="/treasurer/dashboard" element={<TreasurerDashboard />} />
      </Route>

      {/* ---- Protected Routes: Manager ---- */}
      <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
      </Route>

      {/* ---- Protected Routes: Adherent ---- */}
      <Route element={<ProtectedRoute allowedRoles={['adherent']} />}>
        <Route path="/dashboard" element={<AdherentDashboard />} />
      </Route>

      {/* ---- Unauthorized Page ---- */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* ---- Catch-all → Login ---- */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

/* Simple unauthorized page */
function UnauthorizedPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '1rem',
      fontFamily: 'var(--font-family)',
      color: 'var(--color-text-primary)',
      backgroundColor: 'var(--color-surface-secondary)',
    }}>
      <h1 style={{ fontSize: '4rem', margin: 0, color: 'var(--color-error-500)' }}>403</h1>
      <h2 style={{ margin: 0 }}>Access Denied</h2>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        You don&apos;t have permission to access this page.
      </p>
      <a href="/login" style={{ color: 'var(--color-primary-600)', fontWeight: 600 }}>
        Go to Sign In
      </a>
    </div>
  );
}
