import type { TextareaHTMLAttributes } from 'react';
import './FormInput.css';

interface FormTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label: string;
  error?: string;
}

export function FormTextarea({ label, error, id, rows = 3, ...props }: FormTextareaProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={`form-input-group ${error ? 'form-input-group--error' : ''}`}>
      <label htmlFor={inputId} className="form-input-label">{label}</label>
      <div className="form-input-wrapper">
        <textarea id={inputId} className="form-input" rows={rows} aria-invalid={!!error} {...props} />
      </div>
      {error && <p className="form-input-error" role="alert">{error}</p>}
    </div>
  );
}
