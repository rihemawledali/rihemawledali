import { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import './Topbar.css';

interface TopbarProps {
  onOpenMobileSidebar: () => void;
}

export function Topbar({ onOpenMobileSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();
  const roleLabel = user?.role === 'admin'
    ? 'Administrateur'
    : user?.role === 'treasurer'
    ? 'Tresorier'
    : 'Adherent';
  const profilePath = user?.role === 'admin'
    ? '/admin/profile'
    : user?.role === 'treasurer'
    ? '/treasurer/profile'
    : '/adherent/profile';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onOpenMobileSidebar} aria-label="Ouvrir le menu">
          <Menu size={20} />
        </button>
      </div>

      <div className="topbar-right">
        <div className="topbar-profile" ref={profileRef}>
          <button className="topbar-profile-btn" onClick={() => setProfileOpen((v) => !v)}>
            <span className="topbar-avatar">{initials || 'AD'}</span>
            <span className="topbar-profile-text">
              <span className="topbar-profile-name">{user?.firstName} {user?.lastName}</span>
              <span className="topbar-profile-role">{roleLabel}</span>
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
              <button className="topbar-dropdown-item" onClick={() => { setProfileOpen(false); navigate(profilePath); }}>
                <User size={16} />Mon profil
              </button>
              <button className="topbar-dropdown-item" onClick={() => { setProfileOpen(false); navigate(profilePath); }}>
                <Settings size={16} />Paramètres
              </button>
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
