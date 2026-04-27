import type { SelectHTMLAttributes, ReactNode } from 'react';
import './FormInput.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  children?: ReactNode;
}

export function FormSelect({
  label, error, options, placeholder, id, children, ...props
}: FormSelectProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={`form-input-group ${error ? 'form-input-group--error' : ''}`}>
      <label htmlFor={inputId} className="form-input-label">{label}</label>
      <div className="form-input-wrapper">
        <select id={inputId} className="form-input" aria-invalid={!!error} {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
          {children}
        </select>
      </div>
      {error && <p className="form-input-error" role="alert">{error}</p>}
    </div>
  );
}
