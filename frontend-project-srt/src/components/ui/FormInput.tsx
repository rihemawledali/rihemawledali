/* ============================================
   FormInput — Reusable Text Input Component
   ============================================ */

import type { InputHTMLAttributes } from 'react';
import './FormInput.css';

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export function FormInput({ label, error, icon, id, ...props }: FormInputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`form-input-group ${error ? 'form-input-group--error' : ''}`}>
      <label htmlFor={inputId} className="form-input-label">
        {label}
      </label>
      <div className="form-input-wrapper">
        {icon && <span className="form-input-icon">{icon}</span>}
        <input
          id={inputId}
          className={`form-input ${icon ? 'form-input--with-icon' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="form-input-error" role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
