/* ============================================
   LoginPage — Formulaire de connexion
   Design inspiré de Payoneer
   ============================================ */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { FormInput } from '../../../components/ui/FormInput';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { validateLoginForm } from '../utils/validation';
import { ROLE_DASHBOARD_MAP } from '../types/auth.types';
import type { ValidationErrors } from '../types/auth.types';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validateLoginForm({ email, password, rememberMe: false });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    try {
      await login({ email, password, rememberMe: false });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  const { user } = useAuth();
  if (user) {
    const dashboardPath = ROLE_DASHBOARD_MAP[user.role] || '/dashboard';
    navigate(dashboardPath, { replace: true });
    return null;
  }

  return (
    <AuthLayout>
      <div className="login-page">
        {/* Barre supérieure */}
        <div className="login-top-bar">
          <div className="login-logo">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="var(--color-primary-500)" />
              <path d="M24 8L36 16V32L24 40L12 32V16L24 8Z" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.15)" />
              <circle cx="24" cy="24" r="5" fill="white" opacity="0.9" />
            </svg>
            <span className="login-logo-text">SRT Management</span>
          </div>
          <Link to="/signup" className="login-top-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            S'inscrire
          </Link>
        </div>

        {/* Titre */}
        <div className="auth-page-header">
          <h2 className="auth-page-title">Connexion</h2>
        </div>

        {/* Erreur serveur */}
        {serverError && (
          <Alert variant="error" dismissible onDismiss={() => setServerError('')}>
            {serverError}
          </Alert>
        )}

        {/* Formulaire */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <FormInput
            label="Email ou nom d'utilisateur"
            type="email"
            placeholder="Email ou nom d'utilisateur"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <PasswordInput
            label="Mot de passe"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />

          <div className="login-options">
            <Link to="/forgot-password" className="auth-link login-forgot-link">
              Mot de passe oublié ?
            </Link>
          </div>

          <Button type="submit" fullWidth isLoading={isLoading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Se connecter
          </Button>
        </form>

        {/* Pied de page */}
        <p className="auth-page-footer-text">
          Vous n'avez pas de compte ?{' '}
          <Link to="/signup" className="auth-link auth-link--bold">
            Créer un compte
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
