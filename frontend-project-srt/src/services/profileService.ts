import { get, put } from '../shared/api/apiClient';

export type ProfileRole = 'admin' | 'treasurer' | 'adherent';

export interface ProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: ProfileRole;
  status?: string | null;
  matricule?: string | null;
  createdAt?: string | null;
  adherent?: {
    salaire?: number | null;
    enfants?: number | null;
    marie?: boolean | null;
    dateNaissance?: string | null;
  } | null;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
}

export const profileService = {
  async getMe(): Promise<ProfileResponse> {
    const { data } = await get<ProfileResponse>('/api/profile/me');
    return data;
  },

  async updateMe(payload: UpdateProfileRequest): Promise<ProfileResponse> {
    const { data } = await put<ProfileResponse>('/api/profile/me', payload);
    return data;
  },
};
