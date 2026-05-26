import { useCallback, useState, type ReactNode } from 'react';
import type {
  User,
  AuthContextType,
  LoginPayload,
  SignupPayload,
} from '../types/auth.types';
import {
  loginService,
  signupService,
  forgotPasswordService,
  resetPasswordService,
  getCurrentUser,
  updateStoredUser,
  logoutService,
} from '../services/authService';
import { AuthContext } from './authContextInstance';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const isLoading = false;

  const login = useCallback(async (payload: LoginPayload) => {
    const loggedInUser = await loginService(
      payload.email,
      payload.password,
      payload.rememberMe
    );
    setUser(loggedInUser);
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    // Account is created with statut=INACTIF and must be approved by an admin.
    // We deliberately do NOT call setUser here so the SignupPage can redirect
    // to the "pending approval" page instead of logging the user in.
    await signupService(payload);
  }, []);

  const logout = useCallback(() => {
    logoutService();
    setUser(null);
  }, []);

  const updateUser = useCallback((nextUser: User, token?: string) => {
    updateStoredUser(nextUser, token);
    setUser(nextUser);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await forgotPasswordService(email);
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, password: string) => {
    await resetPasswordService(email, code, password);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
