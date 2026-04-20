/* ============================================
   SignupPage — Formulaire d'inscription
   ============================================ */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { FormInput } from '../../../components/ui/FormInput';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Button } from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Alert } from '../../../components/ui/Alert';
import { validateSignupForm } from '../utils/validation';
import { ROLE_DASHBOARD_MAP } from '../types/auth.types';
import type { ValidationErrors } from '../types/auth.types';
import './SignupPage.css';

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, user } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [matricule, setMatricule] = useState('');
  const [enfant, setEnfant] = useState(0);
  const [marie, setMarie] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    const dashboardPath = ROLE_DASHBOARD_MAP[user.role] || '/dashboard';
    navigate(dashboardPath, { replace: true });
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    const formData = {
      firstName, lastName, email, phone,
      matricule, enfant, marie,
      password, confirmPassword,
    };
    const validationErrors = validateSignupForm(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    try {
      await signup(formData);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Une erreur inattendue est survenue.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="signup-page">
        {/* Barre supérieure */}
        <div className="signup-top-bar">
          <div className="signup-logo">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="var(--color-primary-500)" />
              <path d="M24 8L36 16V32L24 40L12 32V16L24 8Z" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.15)" />
              <circle cx="24" cy="24" r="5" fill="white" opacity="0.9" />
            </svg>
            <span className="signup-logo-text">SRT Management</span>
          </div>
          <Link to="/login" className="signup-top-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Se connecter
          </Link>
        </div>

        {/* Titre */}
        <div className="auth-page-header">
          <h2 className="auth-page-title">Créer un compte</h2>
          <p className="auth-page-subtitle">
            Rejoignez la plateforme SRT Management
          </p>
        </div>

        {/* Erreur serveur */}
        {serverError && (
          <Alert variant="error" dismissible onDismiss={() => setServerError('')}>
            {serverError}
          </Alert>
        )}

        {/* Formulaire */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Nom / Prénom */}
          <div className="signup-row">
            <FormInput
              label="Prénom"
              type="text"
              placeholder="Jean"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={errors.firstName}
              autoComplete="given-name"
            />
            <FormInput
              label="Nom"
              type="text"
              placeholder="Dupont"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={errors.lastName}
              autoComplete="family-name"
            />
          </div>

          {/* Email / Matricule */}
          <div className="signup-row">
            <FormInput
              label="Email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />
            <FormInput
              label="Matricule"
              type="text"
              placeholder="MAT-001"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              error={errors.matricule}
            />
          </div>

          {/* Téléphone / Enfants / Marié */}
          <div className="signup-row signup-row--triple">
            <FormInput
              label="Téléphone"
              type="tel"
              placeholder="+212 600 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
              autoComplete="tel"
            />
            <FormInput
              label="Enfants"
              type="number"
              placeholder="0"
              value={String(enfant)}
              onChange={(e) => setEnfant(Number(e.target.value))}
              min={0}
            />
            <div className="signup-checkbox-field">
              <span className="signup-checkbox-label">Marié(e)</span>
              <Checkbox
                label="Oui"
                checked={marie}
                onChange={(e) => setMarie(e.target.checked)}
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="signup-row">
            <PasswordInput
              label="Mot de passe"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="new-password"
            />
            <PasswordInput
              label="Confirmer"
              placeholder="Confirmer"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" fullWidth isLoading={isLoading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            Créer un compte
          </Button>
        </form>

        {/* Pied de page */}
        <p className="auth-page-footer-text">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="auth-link auth-link--bold">
            Se connecter
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
