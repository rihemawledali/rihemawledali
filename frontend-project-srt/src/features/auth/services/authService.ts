import { post } from '../../../shared/api/apiClient';
import type { User, SignupPayload } from '../types/auth.types';

const USER_STORAGE_KEY = 'srt_auth_user';
const TOKEN_STORAGE_KEY = 'srt_token';

interface AuthApiResponse {
  id: string;
  token: string;
  role: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

function getStorage(rememberMe: boolean): Storage {
  return rememberMe ? localStorage : sessionStorage;
}

function mapApiUserToUser(apiUser: AuthApiResponse): User {
  return {
    id: apiUser.id,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    email: apiUser.email,
    phone: apiUser.phone,
    role: apiUser.role as User['role'],
  };
}

export async function loginService(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<User> {
  const { data } = await post<AuthApiResponse>('/api/auth/login', {
    email,
    password,
  });

  const user = mapApiUserToUser(data);
  const storage = getStorage(rememberMe);

  storage.setItem(TOKEN_STORAGE_KEY, data.token);
  storage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  return user;
}

export async function signupService(data: SignupPayload): Promise<User> {
  const { data: apiUser } = await post<AuthApiResponse>('/api/auth/register', {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
    role: 'adherent',
    phone: data.phone,
    matricule: data.matricule,
    enfant: data.enfant,
    marie: data.marie,
  });

  // IMPORTANT: do NOT log the user in.
  // The new account is created with statut=INACTIF and must be approved
  // by an administrator before login is allowed.
  return mapApiUserToUser(apiUser);
}

export async function forgotPasswordService(email: string): Promise<void> {
  await post<{ message: string }>('/api/auth/forgot-password', { email });
}

export async function resetPasswordService(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  await post<{ message: string }>('/api/auth/reset-password', {
    email,
    code,
    newPassword,
  });
}

export function getCurrentUser(): User | null {
  const stored =
    localStorage.getItem(USER_STORAGE_KEY) ||
    sessionStorage.getItem(USER_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return (
    localStorage.getItem(TOKEN_STORAGE_KEY) ||
    sessionStorage.getItem(TOKEN_STORAGE_KEY)
  );
}

export function updateStoredUser(user: User, token?: string): void {
  const serialized = JSON.stringify(user);
  if (localStorage.getItem(USER_STORAGE_KEY)) {
    localStorage.setItem(USER_STORAGE_KEY, serialized);
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
  if (sessionStorage.getItem(USER_STORAGE_KEY)) {
    sessionStorage.setItem(USER_STORAGE_KEY, serialized);
    if (token) sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
}

export function logoutService(): void {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}
