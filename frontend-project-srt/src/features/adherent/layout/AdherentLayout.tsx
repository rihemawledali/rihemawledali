/* ============================================
   Adherent Layout — Shell with sidebar + topbar + content
   ============================================ */

import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Bell, User, Settings, LogOut, Menu, CheckCircle2, AlertCircle, Info, Banknote,
} from 'lucide-react';
import { AdherentSidebar } from './AdherentSidebar';
import { useAuth } from '../../auth/hooks/useAuth';
import './AdherentLayout.css';

interface Notif {
  id: string;
  title: string;
  text: string;
  time: string;
  unread: boolean;
  tone: 'success' | 'warning' | 'info' | 'primary';
  icon: typeof CheckCircle2;
}

const MOCK_NOTIFS: Notif[] = [
  { id: 'n1', title: 'Prêt approuvé',         text: 'Votre demande de prêt #pret-001 a été validée.', time: 'Il y a 2 h',   unread: true,  tone: 'success', icon: CheckCircle2 },
  { id: 'n2', title: 'Indemnité en attente',  text: 'Votre demande d\u2019indemnité naissance est en cours d\u2019examen.', time: 'Hier',        unread: true,  tone: 'warning', icon: AlertCircle  },
  { id: 'n3', title: 'Nouveau bon disponible', text: 'Un bon de commande Pharmacie Centrale vous a été attribué.', time: 'Il y a 3 j',  unread: false, tone: 'primary', icon: Banknote     },
  { id: 'n4', title: 'Adhésion renouvelée',    text: 'Votre adhésion a été renouvelée pour 12 mois.', time: 'Il y a 1 sem.', unread: false, tone: 'info',    icon: Info         },
];

export function AdherentLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>(MOCK_NOTIFS);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const notifRef = useRef<HTMLDivElement | null>(null);
  const userRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userOpen && userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [notifOpen, userOpen]);

  const unreadCount = notifs.filter((n) => n.unread).length;
  const initials = `${user?.firstName?.[0] || 'A'}${user?.lastName?.[0] || 'D'}`.toUpperCase();
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Adhérent';

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));

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
            {/* Notifications */}
            <div className="adherent-dropdown-wrapper" ref={notifRef}>
              <button
                className="adherent-topbar-btn"
                onClick={() => { setNotifOpen((v) => !v); setUserOpen(false); }}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="adherent-topbar-btn-dot">{unreadCount}</span>
                )}
              </button>
              {notifOpen && (
                <div className="adherent-dropdown" style={{ minWidth: 360 }}>
                  <div className="adherent-dropdown-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button className="adherent-dropdown-header-link" onClick={markAllRead}>
                        Tout marquer lu
                      </button>
                    )}
                  </div>
                  <div className="adherent-dropdown-list">
                    {notifs.length === 0 ? (
                      <div style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        Aucune notification
                      </div>
                    ) : (
                      notifs.map((n) => {
                        const Icon = n.icon;
                        const toneColor =
                          n.tone === 'success' ? { bg: 'var(--color-success-50)', fg: 'var(--color-success-600)' } :
                          n.tone === 'warning' ? { bg: 'var(--color-warning-50)', fg: 'var(--color-warning-600)' } :
                          n.tone === 'info'    ? { bg: 'var(--color-info-50)',    fg: 'var(--color-info-600)' } :
                                                 { bg: 'var(--color-primary-50)', fg: 'var(--color-primary-600)' };
                        return (
                          <div key={n.id} className={`adherent-notif ${n.unread ? 'is-unread' : ''}`}>
                            <div className="adherent-notif-icon" style={{ background: toneColor.bg, color: toneColor.fg }}>
                              <Icon size={18} />
                            </div>
                            <div className="adherent-notif-body">
                              <div className="adherent-notif-title">{n.title}</div>
                              <div className="adherent-notif-text">{n.text}</div>
                              <div className="adherent-notif-time">{n.time}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="adherent-dropdown-wrapper" ref={userRef}>
              <button
                className="adherent-topbar-user"
                onClick={() => { setUserOpen((v) => !v); setNotifOpen(false); }}
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
                  <button className="adherent-menu-item" onClick={() => { setUserOpen(false); navigate('/adherent/profil'); }}>
                    <User size={16} /> Mon profil
                  </button>
                  <button className="adherent-menu-item" onClick={() => { setUserOpen(false); navigate('/adherent/profil'); }}>
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
