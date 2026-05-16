/* ============================================
   Profile API — Adherent Portal
   ============================================ */

import { get, put, post } from '../../../shared/api/apiClient';
import type { Adherent } from '../../../shared/types/domain';

export interface ProfileUpdateRequest {
  nom?: string;
  prenom?: string;
  matricule?: string;
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
    const { data } = await get<Adherent>('/api/adherent/profile');
    return data;
  },

  async updateProfile(req: ProfileUpdateRequest): Promise<Adherent> {
    const { data } = await put<Adherent>('/api/adherent/profile', req);
    return data;
  },

  async changePassword(req: ChangePasswordRequest): Promise<{ ok: true }> {
    const { data } = await post<{ ok: true }>('/api/adherent/profile/password', req);
    return data;
  },
};
