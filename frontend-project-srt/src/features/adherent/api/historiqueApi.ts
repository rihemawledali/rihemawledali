/* ============================================
   Historique API — Adherent Portal
   ============================================ */

import { get } from '../../../lib/apiClient';
import type { HistoriqueFinanciere, OperationType } from '../../../types/domain';
import { mockHistorique, delay } from './mockData';

const USE_MOCKS = true;

export interface HistoriqueFilters {
  type?: OperationType | '';
  dateDebut?: string;
  dateFin?: string;
}

export const historiqueApi = {
  async getHistorique(filters?: HistoriqueFilters): Promise<HistoriqueFinanciere[]> {
    let data = mockHistorique;
    
    if (filters?.type) {
      data = data.filter(h => h.type === filters.type);
    }
    if (filters?.dateDebut) {
      data = data.filter(h => h.date >= filters.dateDebut!);
    }
    if (filters?.dateFin) {
      data = data.filter(h => h.date <= filters.dateFin!);
    }

    if (USE_MOCKS) {
      return delay(data, 400);
    }
    
    const queryParams = new URLSearchParams();
    if (filters?.type) queryParams.append('type', filters.type);
    if (filters?.dateDebut) queryParams.append('dateDebut', filters.dateDebut);
    if (filters?.dateFin) queryParams.append('dateFin', filters.dateFin);
    
    const { data: responseData } = await get<HistoriqueFinanciere[]>(`/api/adherent/historique?${queryParams.toString()}`);
    return responseData;
  },

  calculateTotal(items: HistoriqueFinanciere[]): number {
    return items.reduce((sum, item) => sum + item.montant, 0);
  },
};
