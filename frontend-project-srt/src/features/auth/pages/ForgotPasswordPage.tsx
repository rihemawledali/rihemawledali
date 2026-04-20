/* ============================================
   ForgotPasswordPage — Request password reset
   ============================================ */

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { FormInput } from '../../../components/ui/FormInput';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { validateEmail } from '../utils/validation';
import './ForgotPasswordPage.css';

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="forgot-password-page">
        {isSuccess ? (
          /* ---- Success State ---- */
          <div className="forgot-password-success">
            <div className="forgot-password-success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h2 className="auth-page-title">Check your email</h2>
            <p className="auth-page-subtitle">
              We&apos;ve sent a password reset link to <strong>{email}</strong>.
              Please check your inbox and follow the instructions.
            </p>
            <Link to="/login" className="auth-link auth-link--bold">
              &larr; Back to sign in
            </Link>
          </div>
        ) : (
          /* ---- Form State ---- */
          <>
            <div className="auth-page-header">
              <div className="forgot-password-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2 className="auth-page-title">Forgot your password?</h2>
              <p className="auth-page-subtitle">
                No worries. Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            {error && (
              <Alert variant="error" dismissible onDismiss={() => setError('')}>
                {error}
              </Alert>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <FormInput
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error=""
                autoComplete="email"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                }
              />
              <Button type="submit" fullWidth isLoading={isLoading}>
                Send reset link
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
