/* ============================================
   Treasurer Sidebar
   Reuses the same Sidebar.css visual language as admin.
   ============================================ */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Banknote, HeartHandshake, Handshake, Receipt,
  CreditCard, FileText, Ticket, ShoppingCart, Wallet, History,
  User, LogOut, ChevronsLeft,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import logoUrl from '../../../assets/amicalite-srt-logo-v1.png';
import { useAuth } from '../../auth/hooks/useAuth';
import '../../../shared/layout/Sidebar.css';

interface TreasurerSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    items: [
      { to: '/treasurer/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Demandes',
    items: [
      { to: '/treasurer/prets',             label: 'Prêts sociaux',           icon: Banknote },
      { to: '/treasurer/indemnites',        label: 'Indemnités',              icon: HeartHandshake },
      { to: '/treasurer/conventions',       label: 'Conventions',             icon: Handshake },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/treasurer/retenues',   label: 'Retenues mensuelles', icon: Receipt },
      { to: '/treasurer/factures',   label: 'Factures',            icon: FileText },
      { to: '/treasurer/paiements',  label: 'Paiements',           icon: CreditCard },
      { to: '/treasurer/tresorerie', label: 'Trésorerie',          icon: Wallet },
    ],
  },
  {
    label: 'Avantages',
    items: [
      { to: '/treasurer/tickets',       label: 'Tickets restaurant', icon: Ticket },
      { to: '/treasurer/bons-commande', label: 'Bons de commande',   icon: ShoppingCart },
    ],
  },
  {
    label: 'Activité',
    items: [
      { to: '/treasurer/historique', label: 'Historique financier', icon: History },
    ],
  },
  {
    label: 'Compte',
    items: [
      { to: '/treasurer/profile', label: 'Profil', icon: User },
    ],
  },
];

export function TreasurerSidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: TreasurerSidebarProps) {
  const { logout } = useAuth();

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <img
              src={logoUrl}
              alt="Amicale SRT"
              className="sidebar-logo-img"
              draggable={false}
            />
          </div>
          {!collapsed && (
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">Amicale SRT</span>
              <span className="sidebar-brand-sub">Trésorerie</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {GROUPS.map((group, gi) => (
            <div key={gi} className="sidebar-group">
              {group.label && !collapsed && (
                <span className="sidebar-group-label">{group.label}</span>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'is-active' : ''}`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="sidebar-link-icon" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}

          <div className="sidebar-group">
            <button
              type="button"
              onClick={logout}
              className="sidebar-link"
              title={collapsed ? 'Déconnexion' : undefined}
              style={{ background: 'transparent', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
            >
              <LogOut size={18} className="sidebar-link-icon" />
              {!collapsed && <span>Déconnexion</span>}
            </button>
          </div>
        </nav>

        <button className="sidebar-collapse" onClick={onToggle} aria-label="Basculer la barre latérale">
          <ChevronsLeft size={18} />
          {!collapsed && <span>Réduire</span>}
        </button>
      </aside>
    </>
  );
}
