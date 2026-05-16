import { get } from '../../../shared/api/apiClient';

export interface DashboardStats {
  totalAdherents: number;
  pretsActifs: number;
  revenuTotal: number;
  demandesEnAttente: number;
  fournisseursActifs: number;
  trendAdherents: number;
  trendRevenu: number;
  trendPrets: number;
  trendDemandes: number;
}

export const dashboardApi = {
  async stats(): Promise<DashboardStats> {
    const { data } = await get<DashboardStats>('/api/admin/dashboard/stats');
    return data;
  },
};
