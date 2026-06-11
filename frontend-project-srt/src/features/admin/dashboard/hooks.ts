import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './api';

export const adminDashboardQueryKeys = {
  stats: ['admin', 'dashboard', 'stats'] as const,
};

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: adminDashboardQueryKeys.stats,
    queryFn: dashboardApi.stats,
  });
}
