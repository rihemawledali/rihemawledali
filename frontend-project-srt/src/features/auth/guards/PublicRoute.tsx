/* ============================================
   PublicRoute — Redirects authenticated users
   ============================================ */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_DASHBOARD_MAP } from '../types/auth.types';

export function PublicRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
      </div>
    );
  }

  // If already logged in, redirect to their dashboard
  if (isAuthenticated && user) {
    const dashboardPath = ROLE_DASHBOARD_MAP[user.role] || '/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return <Outlet />;
}
