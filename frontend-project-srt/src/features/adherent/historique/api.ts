/* ============================================
   Historique API — Adherent Portal
   ============================================ */

import { get } from '../../../shared/api/apiClient';
import type { HistoriqueFinanciere, OperationType } from '../../../shared/types/domain';

export interface HistoriqueFilters {
  type?: OperationType | '';
  dateDebut?: string;
  dateFin?: string;
}

export const historiqueApi = {
  async getHistorique(filters?: HistoriqueFilters): Promise<HistoriqueFinanciere[]> {
    const queryParams = new URLSearchParams();
    if (filters?.type) queryParams.append('type', filters.type);
    if (filters?.dateDebut) queryParams.append('dateDebut', filters.dateDebut);
    if (filters?.dateFin) queryParams.append('dateFin', filters.dateFin);
    
    const { data: responseData } = await get<HistoriqueFinanciere[]>(`/api/adherent/historique?${queryParams.toString()}`);
    return responseData;
  },
};
