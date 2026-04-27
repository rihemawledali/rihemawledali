/* ============================================
   Adhesion API — Adherent Portal
   ============================================ */

import { get, post } from '../../../lib/apiClient';
import type { Adhesion } from '../../../types/domain';
import { mockAdhesion, mockAdhesionHistory, delay } from './mockData';

const USE_MOCKS = true;

export interface AdhesionRequest {
  montantCotisation: number;
  dateDebut?: string;
  dateFin?: string;
}

export const adhesionApi = {
  async getCurrentAdhesion(): Promise<Adhesion | null> {
    if (USE_MOCKS) {
      return delay(mockAdhesion, 400);
    }
    const { data } = await get<Adhesion>('/api/adherent/adhesion');
    return data;
  },

  async getAdhesionHistory(): Promise<Adhesion[]> {
    if (USE_MOCKS) {
      return delay(mockAdhesionHistory, 400);
    }
    const { data } = await get<Adhesion[]>('/api/adherent/adhesion/history');
    return data;
  },

  async createAdhesion(req: AdhesionRequest): Promise<Adhesion> {
    if (USE_MOCKS) {
      const newAdhesion: Adhesion = {
        id: `adh-${Date.now()}`,
        adherentId: 'adh-001',
        dateDebut: req.dateDebut || new Date().toISOString().split('T')[0],
        dateFin: req.dateFin || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        montantCotisation: req.montantCotisation,
        statut: 'active',
      };
      return delay(newAdhesion, 600);
    }
    const { data } = await post<Adhesion>('/api/adherent/adhesion', req);
    return data;
  },

  async renewAdhesion(): Promise<Adhesion> {
    if (USE_MOCKS) {
      const renewed: Adhesion = {
        ...mockAdhesion,
        id: `adh-${Date.now()}`,
        dateDebut: new Date().toISOString().split('T')[0],
        dateFin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      };
      return delay(renewed, 600);
    }
    const { data } = await post<Adhesion>('/api/adherent/adhesion/renew', {});
    return data;
  },
};
