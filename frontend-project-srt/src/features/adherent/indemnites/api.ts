/* ============================================
   Indemnites API - Adherent Portal
   ============================================ */

import { get, post } from '../../../shared/api/apiClient';
import type { Indemnite, IndemniteType } from '../../../shared/types/domain';

export interface IndemniteRequest {
  type: IndemniteType;
  montant: number;
  motif?: string;
  /** Attachment id obtained from POST /api/files (multipart upload). */
  attachmentId?: number | string;
}

export const indemnitesApi = {
  async getIndemnites(): Promise<Indemnite[]> {
    const { data } = await get<Indemnite[]>('/api/adherent/indemnites');
    return data;
  },

  async createIndemnite(req: IndemniteRequest): Promise<Indemnite> {
    const { data } = await post<Indemnite>('/api/adherent/indemnites', req);
    return data;
  },
};
