import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { conventionsApi, getAdherentConventionStatus } from '../conventions/api';
import { dashboardApi } from './api';
import type { ConventionStats } from './model';

export const adherentDashboardQueryKeys = {
  dashboard: ['adherent', 'dashboard'] as const,
  conventions: ['adherent-conventions'] as const,
  demandes: ['adherent-conventions-demandes'] as const,
};

export function useAdherentDashboard() {
  const dashboard = useQuery({
    queryKey: adherentDashboardQueryKeys.dashboard,
    queryFn: dashboardApi.getDashboard,
  });
  const conventions = useQuery({
    queryKey: adherentDashboardQueryKeys.conventions,
    queryFn: conventionsApi.getConventions,
  });
  const demandes = useQuery({
    queryKey: adherentDashboardQueryKeys.demandes,
    queryFn: conventionsApi.getMyDemandes,
  });

  const conventionStats = useMemo<ConventionStats>(() => {
    return (conventions.data ?? []).reduce(
      (acc, convention) => {
        const status = getAdherentConventionStatus(convention, demandes.data ?? []);
        if (status === 'active') acc.active += 1;
        if (status === 'deja_demandee') acc.pending += 1;
        if (status === 'disponible') acc.available += 1;
        return acc;
      },
      { active: 0, pending: 0, available: 0 }
    );
  }, [conventions.data, demandes.data]);

  return {
    data: dashboard.data,
    conventionStats,
    hasConventionData: !!conventions.data,
    isLoading: dashboard.isLoading || conventions.isLoading || demandes.isLoading,
  };
}
