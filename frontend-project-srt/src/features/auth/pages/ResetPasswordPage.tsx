import { useState, useEffect, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { PasswordStrength } from '../../../components/ui/PasswordStrength';
import { Alert } from '../../../components/ui/Alert';
import { validatePassword, validateConfirmPassword } from '../utils/validation';
import type { ValidationErrors } from '../types/auth.types';

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
      {isSuccess ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '9999px', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', marginBottom: '1.5rem' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className="auth-title">Mot de passe réinitialisé !</h2>
          <p style={{ color: 'var(--auth-text-dim)', marginBottom: '1.5rem' }}>
            Votre mot de passe a été réinitialisé avec succès.
            Redirection vers la page de connexion...
          </p>
        </div>
      ) : (
        <>
          <h1 className="auth-title">Nouveau mot de passe</h1>
          <p style={{ color: 'var(--auth-text-dim)', marginBottom: '2rem', marginTop: '-1rem' }}>
            Votre nouveau mot de passe doit être différent des mots de passe utilisés précédemment.
          </p>

          {serverError && (
            <div className="auth-error-alert">
              <Alert variant="error" dismissible onDismiss={() => setServerError('')}>
                {serverError}
              </Alert>
            </div>
          )}

          <form className="auth-form-fields" onSubmit={handleSubmit} noValidate>
            <PasswordInput
              id="reset-password"
              label="Nouveau mot de passe"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="new-password"
            />

            <div style={{ marginTop: '-0.5rem' }}>
              <PasswordStrength password={password} />
            </div>

            <PasswordInput
              id="reset-confirm"
              label="Confirmer le nouveau mot de passe"
              placeholder=""
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            <button type="submit" className="auth-submit-btn gradient-primary" disabled={isLoading}>
              Réinitialiser le mot de passe
            </button>
          </form>

          <p className="auth-switch-text">
            <Link to="/login" className="text-gradient-link">
              &larr; Retour à la connexion
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
