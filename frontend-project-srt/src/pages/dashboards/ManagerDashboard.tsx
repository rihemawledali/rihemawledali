/* ============================================
   Dashboard Placeholder — Administrative Manager
   ============================================ */

import { useAuth } from '../../features/auth/hooks/useAuth';
import './DashboardPage.css';

export function ManagerDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <div className="dashboard-logo">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="10" fill="var(--color-primary-600)" />
              <path d="M24 12L34 18V30L24 36L14 30V18L24 12Z" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.15)" />
              <circle cx="24" cy="24" r="4" fill="white" />
            </svg>
          </div>
          <span className="dashboard-brand">SRT Management</span>
        </div>
        <div className="dashboard-header-right">
          <span className="dashboard-user-info">
            {user?.firstName} {user?.lastName}
            <span className="dashboard-role-badge dashboard-role-badge--manager">Manager</span>
          </span>
          <button className="dashboard-logout-btn" onClick={logout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </header>
      <main className="dashboard-content">
        <div className="dashboard-welcome-card">
          <h1>Welcome back, {user?.firstName}!</h1>
          <p>You are logged in as <strong>Administrative Manager</strong>. Oversee operations and team management.</p>
        </div>
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-number">12</span>
            <span className="dashboard-stat-label">Team Members</span>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-number">7</span>
            <span className="dashboard-stat-label">Active Tasks</span>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-number">2</span>
            <span className="dashboard-stat-label">Reports Due</span>
          </div>
        </div>
      </main>
    </div>
  );
}
