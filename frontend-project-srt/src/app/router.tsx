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
import { TreasurerLayout } from '../features/treasurer/layout/TreasurerLayout';
import { TreasurerDashboardPage } from '../features/treasurer/dashboard';
import { TreasurerPretsPage } from '../features/treasurer/prets';
import { TreasurerIndemnitesPage } from '../features/treasurer/indemnites';
import { TreasurerRetenuesPage, TreasurerRetenueDetailPage } from '../features/treasurer/retenues';
import { TreasurerTresoreriePage } from '../features/treasurer/tresorerie';
import { TreasurerProfilPage } from '../features/treasurer/profile';
import { TreasurerConventionsPage } from '../features/treasurer/conventions-demande';
import { AdminLayout } from '../features/admin/layout';
import { AdherentLayout } from '../features/adherent/layout/AdherentLayout';
import { AdherentDashboardPage, AdherentProfilePage } from '../features/adherent/profile';
import { AdherentAdhesionPage } from '../features/adherent/adhesion';
import { AdherentPretsPage } from '../features/adherent/prets';
import { AdherentIndemnitesPage } from '../features/adherent/indemnites';
import { AdherentOffresPage } from '../features/adherent/offres';
import { AdherentHistoriquePage } from '../features/adherent/historique';
import {
  AdherentConventionsListPage,
  AdherentConventionDetailsPage,
  AdherentMesDemandesConventionsPage,
} from '../features/adherent/conventions';
import { OverviewPage } from '../features/admin/dashboard';
import { AdminDemandesAdhesionPage } from '../features/admin/adhesions';
import { UsersPage } from '../features/admin/users';
import { SuppliersPage } from '../features/admin/suppliers';
import { ConventionsPage } from '../features/admin/conventions';
import { PaiementsPage } from '../features/treasurer/paiements';
import { FacturesPage } from '../features/treasurer/factures';
import { HistoriquePage } from '../features/treasurer/historique';
import { BonsCommandePage, BonCommandeDetailPage, TicketsPage } from '../features/admin/offers';

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
          <Route path="demandes-adhesion" element={<AdminDemandesAdhesionPage />} />
          <Route path="utilisateurs" element={<UsersPage />} />
          <Route path="fournisseurs" element={<SuppliersPage />} />
          <Route path="conventions" element={<ConventionsPage />} />
        </Route>
      </Route>

      {/* ---- Protected Routes: Treasurer (full dashboard) ---- */}
      <Route element={<ProtectedRoute allowedRoles={['treasurer']} />}>
        <Route path="/treasurer" element={<TreasurerLayout />}>
          <Route index element={<Navigate to="/treasurer/dashboard" replace />} />
          <Route path="dashboard"          element={<TreasurerDashboardPage />} />
          <Route path="prets"              element={<TreasurerPretsPage />} />
          <Route path="indemnites"         element={<TreasurerIndemnitesPage />} />
          <Route path="conventions"        element={<TreasurerConventionsPage />} />
          <Route path="retenues"           element={<TreasurerRetenuesPage />} />
          <Route path="retenues/:id"       element={<TreasurerRetenueDetailPage />} />
          <Route path="paiements"          element={<PaiementsPage />} />
          <Route path="factures"           element={<FacturesPage />} />
          <Route path="tickets"            element={<TicketsPage />} />
          <Route path="bons-commande"      element={<BonsCommandePage />} />
          <Route path="bons-commande/:id"  element={<BonCommandeDetailPage />} />
          <Route path="tresorerie"         element={<TreasurerTresoreriePage />} />
          <Route path="historique"         element={<HistoriquePage />} />
          <Route path="profil"             element={<TreasurerProfilPage />} />
        </Route>
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
          <Route path="conventions/historique" element={<Navigate to="/adherent/conventions/mes-demandes" replace />} />
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
