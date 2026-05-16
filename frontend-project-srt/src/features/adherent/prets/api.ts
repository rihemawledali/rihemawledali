/* ============================================
   Prets (Loans) API - Adherent Portal
   ============================================ */

import { get, post } from '../../../shared/api/apiClient';
import type { PretSocial } from '../../../shared/types/domain';

export interface PretRequest {
  montant: number;
  duree: number;
  taux?: number;
  motif?: string;
  /** Attachment id obtained from POST /api/files (multipart upload). */
  attachmentId?: number | string;
}

export const pretsApi = {
  async getPrets(): Promise<PretSocial[]> {
    const { data } = await get<PretSocial[]>('/api/adherent/prets');
    return data;
  },

  async createPret(req: PretRequest): Promise<PretSocial> {
    const { data } = await post<PretSocial>('/api/adherent/prets', req);
    return data;
  },

  calculateMonthlyPayment(montant: number, duree: number, tauxAnnual: number): number {
    const r = tauxAnnual / 100 / 12;
    if (r === 0) return montant / duree;
    const payment = (montant * r) / (1 - Math.pow(1 + r, -duree));
    return Math.round(payment * 100) / 100;
  },
};
