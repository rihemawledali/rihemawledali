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
import { PendingApprovalPage } from '../features/auth/pages/PendingApprovalPage';
import { TreasurerDashboard } from '../pages/dashboards/TreasurerDashboard';
import { ManagerDashboard } from '../pages/dashboards/ManagerDashboard';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AdherentLayout } from '../features/adherent/layout/AdherentLayout';
import { AdherentDashboardPage } from '../features/adherent/pages/AdherentDashboardPage';
import { AdherentProfilePage } from '../features/adherent/pages/AdherentProfilePage';
import { AdherentAdhesionPage } from '../features/adherent/pages/AdherentAdhesionPage';
import { AdherentPretsPage } from '../features/adherent/pages/AdherentPretsPage';
import { AdherentIndemnitesPage } from '../features/adherent/pages/AdherentIndemnitesPage';
import { AdherentOffresPage } from '../features/adherent/pages/AdherentOffresPage';
import { AdherentHistoriquePage } from '../features/adherent/pages/AdherentHistoriquePage';
import { AdherentConventionsListPage } from '../features/adherent/pages/AdherentConventionsListPage';
import { AdherentConventionDetailsPage } from '../features/adherent/pages/AdherentConventionDetailsPage';
import { AdherentMesDemandesConventionsPage } from '../features/adherent/pages/AdherentMesDemandesConventionsPage';
import { AdherentMesConventionsActivesPage } from '../features/adherent/pages/AdherentMesConventionsActivesPage';
import { AdherentHistoriqueConventionsPage } from '../features/adherent/pages/AdherentHistoriqueConventionsPage';
import { OverviewPage } from '../features/dashboard/pages/OverviewPage';
import { UsersPage } from '../features/users/UsersPage';
import { SuppliersPage } from '../features/suppliers/SuppliersPage';
import { ConventionsPage } from '../features/conventions/ConventionsPage';
import { PaiementsPage } from '../features/finance/PaiementsPage';
import { FacturesPage } from '../features/finance/FacturesPage';
import { HistoriquePage } from '../features/finance/HistoriquePage';
import { BonsCommandePage } from '../features/offers/BonsCommandePage';
import { TicketsPage } from '../features/offers/TicketsPage';

export function AppRouter() {
  return (
    <Routes>
      {/* ---- Public Routes (auth pages) ---- */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />
      </Route>

      {/* ---- Protected Routes: Admin (full dashboard) ---- */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<OverviewPage />} />
          <Route path="utilisateurs" element={<UsersPage />} />
          <Route path="fournisseurs" element={<SuppliersPage />} />
          <Route path="conventions" element={<ConventionsPage />} />
          <Route path="finance/paiements" element={<PaiementsPage />} />
          <Route path="finance/factures" element={<FacturesPage />} />
          <Route path="finance/historique" element={<HistoriquePage />} />
          <Route path="offres/bons-commande" element={<BonsCommandePage />} />
          <Route path="offres/tickets" element={<TicketsPage />} />
        </Route>
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
        <Route path="/adherent" element={<AdherentLayout />}>
          <Route index element={<Navigate to="/adherent/dashboard" replace />} />
          <Route path="dashboard" element={<AdherentDashboardPage />} />
          <Route path="profil" element={<AdherentProfilePage />} />
          <Route path="adhesion" element={<AdherentAdhesionPage />} />
          <Route path="prets" element={<AdherentPretsPage />} />
          <Route path="indemnites" element={<AdherentIndemnitesPage />} />
          <Route path="offres" element={<AdherentOffresPage />} />
          <Route path="conventions" element={<AdherentConventionsListPage />} />
          <Route path="conventions/mes-demandes" element={<AdherentMesDemandesConventionsPage />} />
          <Route path="conventions/actives" element={<AdherentMesConventionsActivesPage />} />
          <Route path="conventions/historique" element={<AdherentHistoriqueConventionsPage />} />
          <Route path="conventions/:id" element={<AdherentConventionDetailsPage />} />
          <Route path="historique" element={<AdherentHistoriquePage />} />
        </Route>
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
