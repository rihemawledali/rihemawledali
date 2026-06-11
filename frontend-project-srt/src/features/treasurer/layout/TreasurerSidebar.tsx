import { DashboardSidebar } from '../../../shared/layout/DashboardSidebar';
import { useAuth } from '../../auth/hooks/useAuth';
import { treasurerNavigation } from '../navigation';

interface TreasurerSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function TreasurerSidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: TreasurerSidebarProps) {
  const { logout } = useAuth();

  return (
    <DashboardSidebar
      brandSubtitle="Tresorerie"
      groups={treasurerNavigation}
      collapsed={collapsed}
      onToggle={onToggle}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
      onLogout={logout}
    />
  );
}
