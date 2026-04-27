import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, FileSignature, ChevronsLeft,
} from 'lucide-react';
import logoUrl from '../../assets/amicalite-srt-logo-v1.png';
import './Sidebar.css';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  { items: [{ to: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, end: true }] },
  {
    label: 'Gestion',
    items: [
      { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
      { to: '/admin/fournisseurs', label: 'Fournisseurs', icon: Building2 },
      { to: '/admin/conventions', label: 'Conventions', icon: FileSignature },
    ],
  },
  // Finance & Offres groups removed from UI (routes/pages still exist in the codebase).
];

export function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: SidebarProps) {
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
              <span className="sidebar-brand-sub">Administration</span>
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
        </nav>

        <button className="sidebar-collapse" onClick={onToggle} aria-label="Basculer la barre latérale">
          <ChevronsLeft size={18} />
          {!collapsed && <span>Réduire</span>}
        </button>
      </aside>
    </>
  );
}
