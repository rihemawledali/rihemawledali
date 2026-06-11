import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from '../../../shared/layout/Topbar';
import { AdminSidebar } from './AdminSidebar';
import './AdminLayout.css';

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`admin-layout ${collapsed ? 'is-collapsed' : ''}`}>
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="admin-layout-main">
        <Topbar onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="admin-layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
