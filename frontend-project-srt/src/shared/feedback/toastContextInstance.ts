import { createContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';
export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}
export interface ToastContextValue {
  push: (input: ToastInput) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
