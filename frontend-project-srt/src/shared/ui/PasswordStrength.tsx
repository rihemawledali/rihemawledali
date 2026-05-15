/* ============================================
   PasswordStrength — Strength bar + rules list
   ============================================ */

import { getPasswordStrength } from '../../features/auth/utils/validation';
import './PasswordStrength.css';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, level, label, rules } = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="password-strength" aria-live="polite">
      {/* Strength bar */}
      <div className="password-strength-bar">
        {[1, 2, 3, 4, 5].map((seg) => (
          <div
            key={seg}
            className={`password-strength-segment ${
              seg <= score ? `password-strength-segment--${level}` : ''
            }`}
          />
        ))}
      </div>
      {label && (
        <span className={`password-strength-label password-strength-label--${level}`}>
          {label}
        </span>
      )}

      {/* Rules checklist */}
      <ul className="password-rules">
        {rules.map((rule) => (
          <li
            key={rule.label}
            className={`password-rule ${rule.passed ? 'password-rule--passed' : ''}`}
          >
            {rule.passed ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
              </svg>
            )}
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
