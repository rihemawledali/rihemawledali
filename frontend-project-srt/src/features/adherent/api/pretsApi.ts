/* ============================================
   Prets (Loans) API — Adherent Portal
   ============================================ */

import { get, post } from '../../../lib/apiClient';
import type { PretSocial } from '../../../types/domain';
import { mockPrets, delay } from './mockData';

const USE_MOCKS = false;

export interface PretRequest {
  montant: number;
  duree: number;
  taux?: number;
  motif?: string;
  /** Attachment id obtained from POST /api/files (multipart upload). */
  attachmentId?: number | string;
  /** Kept for mock compatibility — ignored by backend. */
  documentNom?: string;
  documentSize?: number;
}

export const pretsApi = {
  async getPrets(): Promise<PretSocial[]> {
    if (USE_MOCKS) {
      return delay(mockPrets, 400);
    }
    const { data } = await get<PretSocial[]>('/api/adherent/prets');
    return data;
  },

  async createPret(req: PretRequest): Promise<PretSocial> {
    if (USE_MOCKS) {
      const newPret: PretSocial = {
        id: `pret-${Date.now()}`,
        adherentId: 'adh-001',
        adherentNom: 'Ahmed Ben Salah',
        montant: req.montant,
        duree: req.duree,
        taux: req.taux ?? 2.5,
        statut: 'en_attente',
        dateDemande: new Date().toISOString().split('T')[0],
        motif: req.motif,
        documentNom: req.documentNom,
        documentSize: req.documentSize,
      };
      mockPrets.unshift(newPret);
      return delay(newPret, 600);
    }
    const { data } = await post<PretSocial>('/api/adherent/prets', req);
    return data;
  },

  // Calculate monthly installment: P * (r/12) / (1 - (1 + r/12)^-n)
  calculateMonthlyPayment(montant: number, duree: number, tauxAnnual: number): number {
    const r = tauxAnnual / 100 / 12;
    const n = duree;
    if (r === 0) return montant / n;
    const payment = (montant * r) / (1 - Math.pow(1 + r, -n));
    return Math.round(payment * 100) / 100;
  },
};
