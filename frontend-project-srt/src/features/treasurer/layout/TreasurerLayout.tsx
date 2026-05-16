/* ============================================
   Treasurer Layout — mirrors AdminLayout
   ============================================ */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TreasurerSidebar } from './TreasurerSidebar';
import { Topbar } from '../../../shared/layout/Topbar';
import '../../admin/layout/AdminLayout.css';

export function TreasurerLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`admin-layout ${collapsed ? 'is-collapsed' : ''}`}>
      <TreasurerSidebar
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
