import { useQuery } from '@tanstack/react-query';
import { treasurerApi } from './api';

export const treasurerDashboardQueryKeys = {
  stats: ['treasurer', 'stats'] as const,
  cashflow: ['treasurer', 'cashflow'] as const,
  breakdown: ['treasurer', 'breakdown'] as const,
  requests: ['treasurer', 'requests'] as const,
  operations: ['treasurer', 'operations'] as const,
};

export function useTreasurerDashboard() {
  const stats = useQuery({ queryKey: treasurerDashboardQueryKeys.stats, queryFn: treasurerApi.getStats });
  const cashflow = useQuery({ queryKey: treasurerDashboardQueryKeys.cashflow, queryFn: treasurerApi.getCashflow });
  const breakdown = useQuery({ queryKey: treasurerDashboardQueryKeys.breakdown, queryFn: treasurerApi.getExpenseBreakdown });
  const requests = useQuery({ queryKey: treasurerDashboardQueryKeys.requests, queryFn: treasurerApi.getPendingRequests });
  const operations = useQuery({ queryKey: treasurerDashboardQueryKeys.operations, queryFn: treasurerApi.getRecentOperations });

  const statsData = stats.data;
  const breakdownData = breakdown.data ?? [];
  const netMovement = (statsData?.entreesMois ?? 0) - (statsData?.sortiesMois ?? 0);
  const pendingTotal = (statsData?.pretsAValider ?? 0)
    + (statsData?.indemnitesATraiter ?? 0)
    + (statsData?.facturesImpayees ?? 0);
  const expenseTotal = breakdownData.reduce((sum, slice) => sum + slice.montant, 0);

  return {
    stats,
    cashflow,
    breakdown,
    requests,
    operations,
    statsData,
    cashflowData: cashflow.data ?? [],
    breakdownData,
    requestData: requests.data ?? [],
    operationData: operations.data ?? [],
    netMovement,
    pendingTotal,
    expenseTotal,
  };
}
