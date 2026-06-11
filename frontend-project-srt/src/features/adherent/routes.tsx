import { Navigate, Route } from 'react-router-dom';
import { ProtectedRoute } from '../auth/guards/ProtectedRoute';
import { Profile } from '../../pages/Profile';
import { AdherentLayout } from './layout/AdherentLayout';
import { AdherentDashboardPage } from './dashboard';
import { AdherentAdhesionPage } from './adhesion';
import { AdherentPretsPage } from './prets';
import { AdherentIndemnitesPage } from './indemnites';
import { AdherentOffresPage } from './offres';
import {
  AdherentConventionDetailsPage,
  AdherentConventionsListPage,
  AdherentMesDemandesConventionsPage,
} from './conventions';

export const adherentRoutes = (
  <Route element={<ProtectedRoute allowedRoles={['adherent']} />}>
    <Route path="/adherent" element={<AdherentLayout />}>
      <Route index element={<Navigate to="/adherent/dashboard" replace />} />
      <Route path="dashboard" element={<AdherentDashboardPage />} />
      <Route path="profile" element={<Profile />} />
      <Route path="profil" element={<Navigate to="/adherent/profile" replace />} />
      <Route path="adhesion" element={<AdherentAdhesionPage />} />
      <Route path="prets" element={<AdherentPretsPage />} />
      <Route path="indemnites" element={<AdherentIndemnitesPage />} />
      <Route path="offres" element={<AdherentOffresPage />} />
      <Route path="conventions" element={<AdherentConventionsListPage />} />
      <Route path="conventions/mes-demandes" element={<AdherentMesDemandesConventionsPage />} />
      <Route path="conventions/historique" element={<Navigate to="/adherent/conventions/mes-demandes" replace />} />
      <Route path="conventions/:id" element={<AdherentConventionDetailsPage />} />
    </Route>
  </Route>
);
