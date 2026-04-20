/* ============================================
   Mock Authentication Service
   ============================================
   Replace the internals of this file with real
   API calls (Axios/Fetch + JWT) when ready.
   All consumers use AuthContext, not this file
   directly, so changes are isolated here.
   ============================================ */

import type { User, UserRole, SignupPayload } from '../types/auth.types';

const STORAGE_KEY = 'srt_auth_user';
const SIMULATED_DELAY = 1200; // ms

/** Simulates network latency */
function delay(ms: number = SIMULATED_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Mock user database keyed by email */
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@srt.com': {
    password: 'Password1!',
    user: {
      id: '1',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@srt.com',
      phone: '+212 600 000 001',
      role: 'admin',
    },
  },
  'treasurer@srt.com': {
    password: 'Password1!',
    user: {
      id: '2',
      firstName: 'Treasurer',
      lastName: 'User',
      email: 'treasurer@srt.com',
      phone: '+212 600 000 002',
      role: 'treasurer',
    },
  },
  'manager@srt.com': {
    password: 'Password1!',
    user: {
      id: '3',
      firstName: 'Manager',
      lastName: 'User',
      email: 'manager@srt.com',
      phone: '+212 600 000 003',
      role: 'manager',
    },
  },
  'adherent@srt.com': {
    password: 'Password1!',
    user: {
      id: '4',
      firstName: 'Adherent',
      lastName: 'User',
      email: 'adherent@srt.com',
      phone: '+212 600 000 004',
      role: 'adherent',
    },
  },
};

export async function loginService(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<User> {
  await delay();

  const entry = MOCK_USERS[email.toLowerCase()];
  if (!entry || entry.password !== password) {
    throw new Error('Invalid email or password. Please try again.');
  }

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(STORAGE_KEY, JSON.stringify(entry.user));

  return entry.user;
}

export async function signupService(data: SignupPayload): Promise<User> {
  await delay();

  // Check if email already exists
  if (MOCK_USERS[data.email.toLowerCase()]) {
    throw new Error('An account with this email already exists.');
  }

  const newUser: User = {
    id: String(Date.now()),
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    role: 'adherent' as UserRole, // Default role for self-registration
  };

  // Add to mock database
  MOCK_USERS[data.email.toLowerCase()] = {
    password: data.password,
    user: newUser,
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  return newUser;
}

export async function forgotPasswordService(email: string): Promise<void> {
  await delay();

  const entry = MOCK_USERS[email.toLowerCase()];
  if (!entry) {
    // In production, you'd still return success to avoid email enumeration
    // For demo purposes, we silently succeed
  }
  // Simulates sending a reset email
}

export async function resetPasswordService(
  _token: string,
  _newPassword: string
): Promise<void> {
  await delay();
  // Simulates resetting the password
}

export function getCurrentUser(): User | null {
  const stored =
    localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

export function logoutService(): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}
