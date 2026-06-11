import { get } from '../../../shared/api/apiClient';
import type { DashboardData } from './model';

export const dashboardApi = {
  async getDashboard(): Promise<DashboardData> {
    const { data } = await get<DashboardData>('/api/adherent/dashboard');
    return data;
  },
};
