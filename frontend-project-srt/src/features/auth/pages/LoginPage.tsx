import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../../../shared/api/apiClient';
import { AuthLayout } from '../components/AuthLayout';
import { FormInput } from '../../../shared/ui/FormInput';
import { PasswordInput } from '../../../shared/ui/PasswordInput';
import { Checkbox } from '../../../shared/ui/Checkbox';
import { Alert } from '../../../shared/ui/Alert';
import { validateLoginForm } from '../utils/validation';
import { ROLE_DASHBOARD_MAP } from '../types/auth.types';
import type { ValidationErrors } from '../types/auth.types';

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validateLoginForm({
      email,
      password,
      rememberMe,
    });

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    try {
      await login({ email, password, rememberMe });
    } catch (err) {
      // Pending-approval accounts: redirect instead of showing inline error
      if (err instanceof ApiError) {
        const code = (err.data as { code?: string } | undefined)?.code;
        if (code === 'ACCOUNT_PENDING') {
          navigate('/pending-approval', { state: { email } });
          return;
        }
      }
      setServerError(
        err instanceof Error
          ? err.message
          : 'Une erreur inattendue est survenue.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    const dashboardPath = ROLE_DASHBOARD_MAP[user.role] || '/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <AuthLayout>
      <h1 className="auth-title text-gradient-link">Connexion</h1>



      {serverError && (
        <div className="auth-error-alert">
          <Alert variant="error" dismissible onDismiss={() => setServerError('')}>
            {serverError}
          </Alert>
        </div>
      )}

      <form className="auth-form-fields" onSubmit={handleSubmit} noValidate>
        <FormInput
          id="login-email"
          label="Adresse e-mail"
          type="email"
          placeholder=""
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        <PasswordInput
          id="login-password"
          label="Mot de passe"
          placeholder=""
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Checkbox
            label="Se souvenir de moi"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>
            Mot de passe oublié ?
          </Link>
        </div>

        <button type="submit" className="auth-submit-btn gradient-primary" disabled={isLoading}>
          Se connecter
        </button>
      </form>

      <p className="auth-switch-text">
        Vous n'avez pas de compte ? <Link to="/signup" className="text-gradient-link">S'inscrire</Link>
      </p>
    </AuthLayout>
  );
}
