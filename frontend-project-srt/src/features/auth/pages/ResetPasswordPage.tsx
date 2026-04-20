/* ============================================
   ResetPasswordPage — Set a new password
   ============================================ */

import { useState, useEffect, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { PasswordStrength } from '../../../components/ui/PasswordStrength';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { validatePassword, validateConfirmPassword } from '../utils/validation';
import type { ValidationErrors } from '../types/auth.types';
import './ResetPasswordPage.css';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect to login after success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => navigate('/login', { replace: true }), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    const validationErrors: ValidationErrors = {};
    const passErr = validatePassword(password);
    if (passErr) validationErrors.password = passErr;
    const confirmErr = validateConfirmPassword(password, confirmPassword);
    if (confirmErr) validationErrors.confirmPassword = confirmErr;

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    try {
      await resetPassword(token, password);
      setIsSuccess(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="reset-password-page">
        {isSuccess ? (
          <div className="reset-password-success">
            <div className="reset-password-success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="auth-page-title">Password reset!</h2>
            <p className="auth-page-subtitle">
              Your password has been successfully reset.
              Redirecting you to sign in...
            </p>
          </div>
        ) : (
          <>
            <div className="auth-page-header">
              <div className="reset-password-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              </div>
              <h2 className="auth-page-title">Set new password</h2>
              <p className="auth-page-subtitle">
                Your new password must be different from previously used passwords.
              </p>
            </div>

            {serverError && (
              <Alert variant="error" dismissible onDismiss={() => setServerError('')}>
                {serverError}
              </Alert>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <PasswordInput
                label="New password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                autoComplete="new-password"
              />

              <PasswordStrength password={password} />

              <PasswordInput
                label="Confirm new password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />

              <Button type="submit" fullWidth isLoading={isLoading}>
                Reset password
              </Button>
            </form>

            <p className="auth-page-footer-text">
              <Link to="/login" className="auth-link">
                &larr; Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
