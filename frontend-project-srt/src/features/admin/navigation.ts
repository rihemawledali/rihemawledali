import { Building2, FileSignature, LayoutDashboard, User, UserPlus, Users } from 'lucide-react';
import type { DashboardNavGroup } from '../../shared/layout/DashboardSidebar';

export const adminNavigation: DashboardNavGroup[] = [
  { items: [{ to: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, end: true }] },
  { items: [{ to: '/admin/profile', label: 'Mon profil', icon: User }] },
  {
    label: 'Gestion',
    items: [
      { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
      { to: '/admin/demandes-adhesion', label: 'Demandes adhesion', icon: UserPlus },
      { to: '/admin/fournisseurs', label: 'Fournisseurs', icon: Building2 },
      { to: '/admin/conventions', label: 'Conventions', icon: FileSignature },
    ],
  },
];
