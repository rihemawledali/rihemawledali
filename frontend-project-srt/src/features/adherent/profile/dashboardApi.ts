/* ============================================
   Dashboard API — Adherent Portal
   ============================================ */

import { get } from '../../../shared/lib/apiClient';
import type { DashboardData } from '../shared/mockData';
import { mockDashboardData, delay } from '../shared/mockData';

const USE_MOCKS = false;

export const dashboardApi = {
  async getDashboard(): Promise<DashboardData> {
    if (USE_MOCKS) {
      return delay(mockDashboardData, 600);
    }
    const { data } = await get<DashboardData>('/api/adherent/dashboard');
    return data;
  },
};
