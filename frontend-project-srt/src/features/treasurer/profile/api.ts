import { get, post, put } from '../../../shared/api/apiClient';
import type { User } from '../../auth/types/auth.types';

export interface AccountProfileUpdatePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface AccountPasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface AccountProfileResponse extends User {
  statut?: string;
  matricule?: string;
  createdAt?: string;
  token?: string;
}

function toUser(profile: AccountProfileResponse): User {
  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone ?? '',
    role: profile.role,
  };
}

export const treasurerProfileApi = {
  async getProfile(): Promise<AccountProfileResponse> {
    const { data } = await get<AccountProfileResponse>('/api/account/profile');
    return data;
  },

  async updateProfile(payload: AccountProfileUpdatePayload): Promise<{ user: User; token?: string }> {
    const { data } = await put<AccountProfileResponse>('/api/account/profile', payload);
    return { user: toUser(data), token: data.token };
  },

  async changePassword(payload: AccountPasswordPayload): Promise<void> {
    await post<{ ok: true }>('/api/account/profile/password', payload);
  },
};
