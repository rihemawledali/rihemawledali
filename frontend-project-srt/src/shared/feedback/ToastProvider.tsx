import { useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastContext, type ToastInput, type ToastVariant } from './toastContextInstance';
import './Toast.css';

interface Toast extends ToastInput {
  id: string;
  variant: ToastVariant;
}

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

export function ToastProvider({ children }: any) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = (id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  };

  const push = (input: ToastInput) => {
    const id = Math.random().toString(36).slice(2);
    const variant = input.variant ?? 'info';
    const toast: Toast = { id, variant, ...input };
    setToasts((t) => [...t, toast]);
    setTimeout(() => remove(id), input.durationMs ?? 4000);
  };

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toast-stack" role="region" aria-label="Notifications">
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div key={t.id} className={`toast toast--${t.variant}`} role="status">
              <Icon size={20} className="toast-icon" />
              <div className="toast-body">
                <p className="toast-title">{t.title}</p>
                {t.description && <p className="toast-desc">{t.description}</p>}
              </div>
              <button className="toast-close" onClick={() => remove(t.id)} aria-label="Fermer">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
