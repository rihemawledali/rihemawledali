import { DashboardSidebar } from '../../../shared/layout/DashboardSidebar';
import { adminNavigation } from '../navigation';

export function AdminSidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: any) {
  return (
    <DashboardSidebar
      brandSubtitle="Administration"
      groups={adminNavigation}
      collapsed={collapsed}
      onToggle={onToggle}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
    />
  );
}
