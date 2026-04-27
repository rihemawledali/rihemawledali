import type { InputHTMLAttributes, ReactNode } from 'react';
import './Checkbox.css';

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  label: ReactNode;
}

export function Checkbox({ label, id, ...props }: CheckboxProps) {
  const checkboxId =
    id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : 'checkbox');

  return (
    <label htmlFor={checkboxId} className="checkbox-wrapper">
      <input
        id={checkboxId}
        type="checkbox"
        className="checkbox-input"
        {...props}
      />
      <span className="checkbox-custom" aria-hidden="true">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span className="checkbox-label">{label}</span>
    </label>
  );
}
