/* ============================================
   Adherent Layout — Shell with sidebar + topbar + content
   ============================================ */

import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Menu } from 'lucide-react';
import { AdherentSidebar } from './AdherentSidebar';
import { useAuth } from '../../auth/hooks/useAuth';
import './AdherentLayout.css';

export function AdherentLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const userRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (userOpen && userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [userOpen]);

  const initials = `${user?.firstName?.[0] || 'A'}${user?.lastName?.[0] || 'D'}`.toUpperCase();
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Adhérent';

  return (
    <div className={`adherent-layout ${collapsed ? 'is-collapsed' : ''}`}>
      <AdherentSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={logout}
      />
      <div className="adherent-layout-main">
        <header className="adherent-topbar">
          <button
            className="adherent-topbar-menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <div className="adherent-topbar-title">Espace Adhérent</div>

          <div className="adherent-topbar-spacer" />

          <div className="adherent-topbar-actions">
            <div className="adherent-dropdown-wrapper" ref={userRef}>
              <button
                className="adherent-topbar-user"
                onClick={() => setUserOpen((v) => !v)}
                aria-label="Menu utilisateur"
              >
                <span className="adherent-topbar-user-avatar">{initials}</span>
                <span className="adherent-topbar-user-name">{fullName}</span>
              </button>
              {userOpen && (
                <div className="adherent-dropdown" style={{ minWidth: 220 }}>
                  <div className="adherent-dropdown-header" style={{ display: 'block' }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{fullName}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{user?.email}</div>
                  </div>
                  <button className="adherent-menu-item" onClick={() => { setUserOpen(false); navigate('/adherent/profile'); }}>
                    <User size={16} /> Mon profil
                  </button>
                  <button className="adherent-menu-item" onClick={() => { setUserOpen(false); navigate('/adherent/profile'); }}>
                    <Settings size={16} /> Paramètres
                  </button>
                  <div className="adherent-menu-divider" />
                  <button className="adherent-menu-item is-danger" onClick={() => { setUserOpen(false); logout(); }}>
                    <LogOut size={16} /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="adherent-layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
