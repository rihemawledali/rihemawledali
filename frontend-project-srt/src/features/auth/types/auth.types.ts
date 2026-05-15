/* ============================================
   Authentication Type Definitions
   ============================================ */

export type UserRole = 'admin' | 'treasurer' | 'manager' | 'adherent';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  matricule: string;
  enfant: number;
  marie: boolean;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateUser: (user: User, token?: string) => void;
}

/** Maps each role to its dashboard route */
export const ROLE_DASHBOARD_MAP: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  treasurer: '/treasurer/dashboard',
  manager: '/manager/dashboard',
  adherent: '/adherent/dashboard',
};

export interface ValidationErrors {
  [field: string]: string;
}
