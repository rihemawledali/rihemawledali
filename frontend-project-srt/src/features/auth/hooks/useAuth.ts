/* ============================================
   useAuth Hook — Typed access to AuthContext
   ============================================ */

import { useContext } from 'react';
import { AuthContext } from '../context/authContextInstance';
import type { AuthContextType } from '../types/auth.types';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
