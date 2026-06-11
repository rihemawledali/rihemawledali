import { get } from '../../../shared/api/apiClient';
import type { DashboardStats } from './model';

export const dashboardApi = {
  async stats(): Promise<DashboardStats> {
    const { data } = await get<DashboardStats>('/api/admin/dashboard/stats');
    return data;
  },
};
