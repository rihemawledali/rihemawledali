import { NavLink } from 'react-router-dom';
import { ChevronsLeft, LogOut, type LucideIcon } from 'lucide-react';
import logoUrl from '../../assets/amicalite-srt-logo-v1.png';
import './Sidebar.css';

export interface DashboardNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface DashboardNavGroup {
  label?: string;
  items: DashboardNavItem[];
}

interface DashboardSidebarProps {
  brandSubtitle: string;
  groups: DashboardNavGroup[];
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout?: () => void;
}

export function DashboardSidebar({
  brandSubtitle,
  groups,
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
  onLogout,
}: DashboardSidebarProps) {
  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <img src={logoUrl} alt="Amicale SRT" className="sidebar-logo-img" draggable={false} />
          </div>
          {!collapsed && (
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">Amicale SRT</span>
              <span className="sidebar-brand-sub">{brandSubtitle}</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {groups.map((group, groupIndex) => (
            <div key={groupIndex} className="sidebar-group">
              {group.label && !collapsed && <span className="sidebar-group-label">{group.label}</span>}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onCloseMobile}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="sidebar-link-icon" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}

          {onLogout && (
            <div className="sidebar-group">
              <button
                type="button"
                onClick={onLogout}
                className="sidebar-link sidebar-link-button"
                title={collapsed ? 'Deconnexion' : undefined}
              >
                <LogOut size={18} className="sidebar-link-icon" />
                {!collapsed && <span>Deconnexion</span>}
              </button>
            </div>
          )}
        </nav>

        <button className="sidebar-collapse" onClick={onToggle} aria-label="Basculer la barre laterale">
          <ChevronsLeft size={18} />
          {!collapsed && <span>Reduire</span>}
        </button>
      </aside>
    </>
  );
}
