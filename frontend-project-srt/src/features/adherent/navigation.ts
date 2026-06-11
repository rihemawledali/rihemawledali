import {
  BadgeCheck,
  Banknote,
  ChevronsLeft,
  FileClock,
  Handshake,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Tag,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AdherentNavGroup {
  title?: string;
  items: { to: string; label: string; icon: LucideIcon }[];
}

export const adherentNavigation: AdherentNavGroup[] = [
  {
    items: [
      { to: '/adherent/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { to: '/adherent/profile', label: 'Mon profil', icon: User },
      { to: '/adherent/adhesion', label: 'Mon adhesion', icon: BadgeCheck },
      { to: '/adherent/prets', label: 'Mes prets', icon: Banknote },
      { to: '/adherent/indemnites', label: 'Mes indemnites', icon: HeartHandshake },
      { to: '/adherent/offres', label: 'Tickets restaurant', icon: Tag },
    ],
  },
  {
    title: 'Conventions',
    items: [
      { to: '/adherent/conventions', label: 'Offres et conventions', icon: Handshake },
      { to: '/adherent/conventions/mes-demandes', label: 'Mes demandes', icon: FileClock },
    ],
  },
];

export { ChevronsLeft, LogOut };
