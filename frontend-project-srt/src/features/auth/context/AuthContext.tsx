/* ============================================
   Auth Context — Global Authentication State
   ============================================ */

import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, AuthContextType, LoginPayload, SignupPayload } from '../types/auth.types';
import {
  loginService,
  signupService,
  forgotPasswordService,
  resetPasswordService,
  getCurrentUser,
  logoutService,
} from '../services/authService';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true on mount while checking storage

  // Check for existing session on mount
  useEffect(() => {
    const existingUser = getCurrentUser();
    if (existingUser) {
      setUser(existingUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const loggedInUser = await loginService(
      payload.email,
      payload.password,
      payload.rememberMe
    );
    setUser(loggedInUser);
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    const newUser = await signupService(payload);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    logoutService();
    setUser(null);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await forgotPasswordService(email);
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    await resetPasswordService(token, password);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
