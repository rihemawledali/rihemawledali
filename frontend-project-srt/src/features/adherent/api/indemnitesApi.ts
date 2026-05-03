/* ============================================
   Indemnites API — Adherent Portal
   ============================================ */

import { get, post } from '../../../lib/apiClient';
import type { Indemnite, IndemniteType } from '../../../types/domain';
import { mockIndemnites, delay } from './mockData';

const USE_MOCKS = false;

export interface IndemniteRequest {
  type: IndemniteType;
  montant: number;
  motif?: string;
  /** Attachment id obtained from POST /api/files (multipart upload). */
  attachmentId?: number | string;
  /** Kept for mock compatibility — ignored by backend. */
  documentNom?: string;
  documentSize?: number;
}

export const indemnitesApi = {
  async getIndemnites(): Promise<Indemnite[]> {
    if (USE_MOCKS) {
      return delay(mockIndemnites, 400);
    }
    const { data } = await get<Indemnite[]>('/api/adherent/indemnites');
    return data;
  },

  async createIndemnite(req: IndemniteRequest): Promise<Indemnite> {
    if (USE_MOCKS) {
      const newIndemnite: Indemnite = {
        id: `ind-${Date.now()}`,
        adherentId: 'adh-001',
        adherentNom: 'Ahmed Ben Salah',
        type: req.type,
        montant: req.montant,
        statut: 'en_attente',
        dateDemande: new Date().toISOString().split('T')[0],
        motif: req.motif,
        documentNom: req.documentNom,
        documentSize: req.documentSize,
      };
      mockIndemnites.unshift(newIndemnite);
      return delay(newIndemnite, 600);
    }
    const { data } = await post<Indemnite>('/api/adherent/indemnites', req);
    return data;
  },
};
