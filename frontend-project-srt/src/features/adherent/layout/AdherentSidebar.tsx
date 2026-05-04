/* ============================================
   Adherent Sidebar — Navigation
   ============================================ */

import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, User, BadgeCheck, Banknote, HeartHandshake, Tag, History, LogOut, ChevronsLeft,
  Handshake, FileClock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import logoUrl from '../../../assets/amicalite-srt-logo-v1.png';
import './AdherentSidebar.css';

interface AdherentSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

interface NavGroup {
  title?: string;
  items: { to: string; label: string; icon: LucideIcon }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { to: '/adherent/dashboard',   label: 'Tableau de bord',    icon: LayoutDashboard },
      { to: '/adherent/profil',      label: 'Mon profil',         icon: User },
      { to: '/adherent/adhesion',    label: 'Mon adhésion',       icon: BadgeCheck },
      { to: '/adherent/prets',       label: 'Mes prêts',          icon: Banknote },
      { to: '/adherent/indemnites',  label: 'Mes indemnités',     icon: HeartHandshake },
      { to: '/adherent/offres',      label: 'Tickets restaurant', icon: Tag },
    ],
  },
  {
    title: 'Conventions',
    items: [
      { to: '/adherent/conventions',                label: 'Offres et conventions',     icon: Handshake },
      { to: '/adherent/conventions/mes-demandes',   label: 'Mes demandes',              icon: FileClock },
    ],
  },
  {
    items: [
      { to: '/adherent/historique', label: 'Historique financier', icon: History },
    ],
  },
];

export function AdherentSidebar({ collapsed, onToggle, mobileOpen, onCloseMobile, onLogout }: AdherentSidebarProps) {
  const location = useLocation();

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`adherent-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
        <div className="adherent-sidebar-brand">
          <div className="adherent-sidebar-logo">
            <img src={logoUrl} alt="Amicale SRT" className="adherent-sidebar-logo-img" draggable={false} />
          </div>
          {!collapsed && (
            <div className="adherent-sidebar-brand-text">
              <span className="adherent-sidebar-brand-name">Amicale SRT</span>
              <span className="adherent-sidebar-brand-sub">Espace Adhérent</span>
            </div>
          )}
        </div>

        <nav className="adherent-sidebar-nav">
          {NAV_GROUPS.map((group, gi) => (
            <div className="adherent-sidebar-group" key={gi}>
              {group.title && !collapsed && (
                <div className="adherent-sidebar-group-title">{group.title}</div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                // Exact match for the conventions list page so its sub-routes don't keep it active
                const isExactRoute = item.to === '/adherent/conventions';
                const isActive = isExactRoute
                  ? location.pathname === item.to
                  : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    className={`adherent-sidebar-link ${isActive ? 'is-active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="adherent-sidebar-link-icon" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}

          <div className="adherent-sidebar-separator" />

          <div className="adherent-sidebar-group">
            <button className="adherent-sidebar-link adherent-sidebar-link--logout" onClick={onLogout} title={collapsed ? 'Déconnexion' : undefined}>
              <LogOut size={18} className="adherent-sidebar-link-icon" />
              {!collapsed && <span>Déconnexion</span>}
            </button>
          </div>
        </nav>

        <button className="adherent-sidebar-collapse" onClick={onToggle} aria-label="Basculer la barre latérale">
          <ChevronsLeft size={18} />
          {!collapsed && <span>Réduire</span>}
        </button>
      </aside>
    </>
  );
}
