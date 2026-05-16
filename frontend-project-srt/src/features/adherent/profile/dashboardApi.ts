/* ============================================
   Dashboard API — Adherent Portal
   ============================================ */

import { get } from '../../../shared/api/apiClient';
import type { Adherent, Adhesion, HistoriqueFinanciere, PretSocial } from '../../../shared/types/domain';

export interface DashboardData {
  profile: Adherent;
  adhesion: Adhesion | null;
  activeLoan: PretSocial | null;
  pendingIndemnities: number;
  availableOffers: number;
  recentHistory: HistoriqueFinanciere[];
  financialChart: { month: string; solde: number }[];
}

export const dashboardApi = {
  async getDashboard(): Promise<DashboardData> {
    const { data } = await get<DashboardData>('/api/adherent/dashboard');
    return data;
  },
};
