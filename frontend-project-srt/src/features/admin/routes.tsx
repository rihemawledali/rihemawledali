import { Navigate, Route } from 'react-router-dom';
import { ProtectedRoute } from '../auth/guards/ProtectedRoute';
import { AdminLayout } from './layout';
import { AdminDashboardPage } from './dashboard';
import { AdminDemandesAdhesionPage } from './adhesions';
import { UsersPage } from './users';
import { SuppliersPage } from './suppliers';
import { ConventionsPage } from './conventions';
import { Profile } from '../../pages/Profile';

export const adminRoutes = (
  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboardPage />} />
      <Route path="demandes-adhesion" element={<AdminDemandesAdhesionPage />} />
      <Route path="utilisateurs" element={<UsersPage />} />
      <Route path="fournisseurs" element={<SuppliersPage />} />
      <Route path="conventions" element={<ConventionsPage />} />
      <Route path="profile" element={<Profile />} />
      <Route path="profil" element={<Navigate to="/admin/profile" replace />} />
    </Route>
  </Route>
);
