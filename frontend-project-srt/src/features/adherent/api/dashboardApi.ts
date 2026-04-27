/* ============================================
   Dashboard API — Adherent Portal
   ============================================ */

import { get } from '../../../lib/apiClient';
import type { DashboardData } from './mockData';
import { mockDashboardData, delay } from './mockData';

const USE_MOCKS = true; // Toggle to false when backend is ready

export const dashboardApi = {
  async getDashboard(): Promise<DashboardData> {
    if (USE_MOCKS) {
      return delay(mockDashboardData, 600);
    }
    const { data } = await get<DashboardData>('/api/adherent/dashboard');
    return data;
  },
};
