import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import './Topbar.css';

interface TopbarProps {
  onOpenMobileSidebar: () => void;
}

export function Topbar({ onOpenMobileSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  const notifications = [
    { id: 1, title: '3 conventions arrivent à expiration', time: 'Il y a 1h', tone: 'warning' as const },
    { id: 2, title: 'Nouveau prêt en attente d\'approbation', time: 'Il y a 3h', tone: 'info' as const },
    { id: 3, title: 'Facture FAC-2025-0004 en retard', time: 'Hier', tone: 'error' as const },
  ];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onOpenMobileSidebar} aria-label="Ouvrir le menu">
          <Menu size={20} />
        </button>
      </div>

      <div className="topbar-right">
        <div className="topbar-notif" ref={notifRef}>
          <button
            className="topbar-icon-btn"
            aria-label="Notifications"
            onClick={() => setNotifOpen((v) => !v)}
          >
            <Bell size={18} />
            <span className="topbar-notif-dot" />
          </button>
          {notifOpen && (
            <div className="topbar-dropdown topbar-dropdown--notif">
              <div className="topbar-dropdown-header">
                <strong>Notifications</strong>
                <span className="topbar-notif-count">{notifications.length}</span>
              </div>
              <ul className="topbar-notif-list">
                {notifications.map((n) => (
                  <li key={n.id} className={`topbar-notif-item topbar-notif-item--${n.tone}`}>
                    <span className="topbar-notif-bullet" />
                    <div>
                      <p>{n.title}</p>
                      <span>{n.time}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="topbar-profile" ref={profileRef}>
          <button className="topbar-profile-btn" onClick={() => setProfileOpen((v) => !v)}>
            <span className="topbar-avatar">{initials || 'AD'}</span>
            <span className="topbar-profile-text">
              <span className="topbar-profile-name">{user?.firstName} {user?.lastName}</span>
              <span className="topbar-profile-role">Administrateur</span>
            </span>
          </button>
          {profileOpen && (
            <div className="topbar-dropdown topbar-dropdown--profile">
              <div className="topbar-dropdown-profile-info">
                <span className="topbar-avatar topbar-avatar--lg">{initials || 'AD'}</span>
                <div>
                  <strong>{user?.firstName} {user?.lastName}</strong>
                  <p>{user?.email}</p>
                </div>
              </div>
              <button className="topbar-dropdown-item"><User size={16} />Mon profil</button>
              <button className="topbar-dropdown-item"><Settings size={16} />Paramètres</button>
              <hr />
              <button className="topbar-dropdown-item is-danger" onClick={logout}>
                <LogOut size={16} />Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
