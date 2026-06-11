import { NavLink, useLocation } from 'react-router-dom';
import { adherentNavigation, ChevronsLeft, LogOut } from '../navigation';
import './AdherentSidebar.css';

interface AdherentSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export function AdherentSidebar({ collapsed, onToggle, mobileOpen, onCloseMobile, onLogout }: AdherentSidebarProps) {
  const location = useLocation();

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`adherent-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
        <div className="adherent-sidebar-brand">
          {!collapsed && (
            <div className="adherent-sidebar-brand-text">
              <span className="adherent-sidebar-brand-name">Amicale SRT</span>
              <span className="adherent-sidebar-brand-sub">Espace Adherent</span>
            </div>
          )}
        </div>

        <nav className="adherent-sidebar-nav">
          {adherentNavigation.map((group, groupIndex) => (
            <div className="adherent-sidebar-group" key={groupIndex}>
              {group.title && !collapsed && (
                <div className="adherent-sidebar-group-title">{group.title}</div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
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
            <button className="adherent-sidebar-link adherent-sidebar-link--logout" onClick={onLogout} title={collapsed ? 'Deconnexion' : undefined}>
              <LogOut size={18} className="adherent-sidebar-link-icon" />
              {!collapsed && <span>Deconnexion</span>}
            </button>
          </div>
        </nav>

        <button className="adherent-sidebar-collapse" onClick={onToggle} aria-label="Basculer la barre laterale">
          <ChevronsLeft size={18} />
          {!collapsed && <span>Reduire</span>}
        </button>
      </aside>
    </>
  );
}
