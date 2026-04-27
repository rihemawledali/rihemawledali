/* ============================================
   Profile API — Adherent Portal
   ============================================ */

import { get, put, post } from '../../../lib/apiClient';
import type { Adherent } from '../../../types/domain';
import { mockAdherent, delay } from './mockData';

const USE_MOCKS = true;

export interface ProfileUpdateRequest {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  dateNaissance?: string;
  salaire?: number;
  enfants?: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const profileApi = {
  async getProfile(): Promise<Adherent> {
    if (USE_MOCKS) {
      return delay({ ...mockAdherent }, 400);
    }
    const { data } = await get<Adherent>('/api/adherent/profile');
    return data;
  },

  async updateProfile(req: ProfileUpdateRequest): Promise<Adherent> {
    if (USE_MOCKS) {
      const updated = { ...mockAdherent, ...req };
      return delay(updated, 500);
    }
    const { data } = await put<Adherent>('/api/adherent/profile', req);
    return data;
  },

  async changePassword(req: ChangePasswordRequest): Promise<{ ok: true }> {
    if (USE_MOCKS) {
      // Pretend "demo123" is the current password for the mock account
      if (req.currentPassword !== 'demo123') {
        await delay(null, 400);
        throw new Error('Mot de passe actuel incorrect');
      }
      return delay({ ok: true as const }, 500);
    }
    const { data } = await post<{ ok: true }>('/api/adherent/profile/password', req);
    return data;
  },
};
