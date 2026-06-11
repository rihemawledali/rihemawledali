import {
  Banknote,
  CreditCard,
  FileText,
  Handshake,
  HeartHandshake,
  History,
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Ticket,
  User,
  Wallet,
} from 'lucide-react';
import type { DashboardNavGroup } from '../../shared/layout/DashboardSidebar';

export const treasurerNavigation: DashboardNavGroup[] = [
  { items: [{ to: '/treasurer/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, end: true }] },
  {
    label: 'Demandes',
    items: [
      { to: '/treasurer/prets', label: 'Prets sociaux', icon: Banknote },
      { to: '/treasurer/indemnites', label: 'Indemnites', icon: HeartHandshake },
      { to: '/treasurer/conventions', label: 'Conventions', icon: Handshake },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/treasurer/retenues', label: 'Retenues mensuelles', icon: Receipt },
      { to: '/treasurer/factures', label: 'Factures', icon: FileText },
      { to: '/treasurer/paiements', label: 'Paiements', icon: CreditCard },
      { to: '/treasurer/tresorerie', label: 'Tresorerie', icon: Wallet },
    ],
  },
  {
    label: 'Avantages',
    items: [
      { to: '/treasurer/tickets', label: 'Tickets restaurant', icon: Ticket },
      { to: '/treasurer/bons-commande', label: 'Bons de commande', icon: ShoppingCart },
    ],
  },
  { label: 'Activite', items: [{ to: '/treasurer/historique', label: 'Historique financier', icon: History }] },
  { label: 'Compte', items: [{ to: '/treasurer/profile', label: 'Profil', icon: User }] },
];
