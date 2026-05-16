/* ============================================
   Adhesion API — Adherent Portal
   ============================================ */

import { get } from '../../../shared/api/apiClient';
import type { Adhesion } from '../../../shared/types/domain';

export interface AdhesionRequest {
  montantCotisation: number;
  dateDebut?: string;
  dateFin?: string;
}

export const adhesionApi = {
  
  async getCurrentAdhesion(): Promise<Adhesion | null> {
    const { data } = await get<Adhesion>('/api/adherent/adhesion');
    return data;
  },

  async getAdhesionHistory(): Promise<Adhesion[]> {
    const { data } = await get<Adhesion[]>('/api/adherent/adhesion/history');
    return data;
  },
};
