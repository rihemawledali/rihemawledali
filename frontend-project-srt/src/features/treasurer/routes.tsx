import { Navigate, Route } from 'react-router-dom';
import { ProtectedRoute } from '../auth/guards/ProtectedRoute';
import { Profile } from '../../pages/Profile';
import { BonsCommandePage, BonCommandeDetailPage, TicketsPage } from './offers';
import { TreasurerLayout } from './layout/TreasurerLayout';
import { TreasurerDashboardPage } from './dashboard';
import { TreasurerPretDetailPage, TreasurerPretsPage } from './prets';
import { TreasurerIndemnitesPage } from './indemnites';
import { TreasurerRetenueDetailPage, TreasurerRetenuesPage } from './retenues';
import { TreasurerTresoreriePage } from './tresorerie';
import { TreasurerConventionsPage } from './conventions-demande';
import { PaiementsPage } from './paiements';
import { FacturesPage } from './factures';
import { HistoriquePage } from './historique';

export const treasurerRoutes = (
  <Route element={<ProtectedRoute allowedRoles={['treasurer']} />}>
    <Route path="/treasurer" element={<TreasurerLayout />}>
      <Route index element={<Navigate to="/treasurer/dashboard" replace />} />
      <Route path="dashboard" element={<TreasurerDashboardPage />} />
      <Route path="prets" element={<TreasurerPretsPage />} />
      <Route path="prets/:id" element={<TreasurerPretDetailPage />} />
      <Route path="indemnites" element={<TreasurerIndemnitesPage />} />
      <Route path="conventions" element={<TreasurerConventionsPage />} />
      <Route path="retenues" element={<TreasurerRetenuesPage />} />
      <Route path="retenues/:id" element={<TreasurerRetenueDetailPage />} />
      <Route path="paiements" element={<PaiementsPage />} />
      <Route path="factures" element={<FacturesPage />} />
      <Route path="tickets" element={<TicketsPage />} />
      <Route path="bons-commande" element={<BonsCommandePage />} />
      <Route path="bons-commande/:id" element={<BonCommandeDetailPage />} />
      <Route path="tresorerie" element={<TreasurerTresoreriePage />} />
      <Route path="historique" element={<HistoriquePage />} />
      <Route path="profile" element={<Profile />} />
      <Route path="profil" element={<Navigate to="/treasurer/profile" replace />} />
    </Route>
  </Route>
);
