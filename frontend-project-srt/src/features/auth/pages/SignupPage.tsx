import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { FormInput } from '../../../shared/ui/FormInput';
import { PasswordInput } from '../../../shared/ui/PasswordInput';
import { PasswordStrength } from '../../../shared/ui/PasswordStrength';
import { Checkbox } from '../../../shared/ui/Checkbox';
import { Alert } from '../../../shared/ui/Alert';
import { validateSignupForm } from '../utils/validation';
import { ROLE_DASHBOARD_MAP } from '../types/auth.types';
import type { ValidationErrors } from '../types/auth.types';

export function SignupPage() {
  const { signup, user } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [matricule, setMatricule] = useState('');
  const [enfant, setEnfant] = useState(0);
  const [marie, setMarie] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    const dashboardPath = ROLE_DASHBOARD_MAP[user.role] || '/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    const trimmedName = fullName.trim().replace(/\s+/g, ' ');
    const [firstName = '', ...lastNameParts] = trimmedName.split(' ');
    const lastName = lastNameParts.join(' ');

    const formData = {
      firstName,
      lastName,
      email,
      phone,
      matricule,
      enfant,
      marie,
      password,
      confirmPassword,
    };

    const validationErrors = validateSignupForm(formData);
    if (!trimmedName) {
      validationErrors.fullName = 'Le nom complet est requis';
    } else if (!lastName) {
      validationErrors.fullName = 'Veuillez saisir votre prénom et votre nom';
    }
    if (!acceptedTerms) {
      validationErrors.acceptedTerms =
        'Vous devez accepter les conditions et l\'avis de confidentialité';
    }
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    try {
      await signup(formData);
      // Account created with statut=INACTIF — redirect to pending approval page
      navigate('/pending-approval', {
        replace: true,
        state: { email, firstName },
      });
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : 'Une erreur inattendue est survenue.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="auth-title text-gradient-link">Créer un compte</h1>

      {serverError && (
        <div className="auth-error-alert">
          <Alert variant="error" dismissible onDismiss={() => setServerError('')}>
            {serverError}
          </Alert>
        </div>
      )}

      <form className="auth-form-fields" onSubmit={handleSubmit} noValidate>
        <div className="signup-section">
          <div className="signup-row signup-row--full">
            <FormInput
              id="signup-fullname"
              label="Nom complet"
              type="text"
              placeholder=""
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
              autoComplete="name"
            />
          </div>

          <div className="signup-row">
            <FormInput
              id="signup-email"
              label="E-mail"
              type="email"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />

            <FormInput
              id="signup-matricule"
              label="Matricule"
              type="text"
              placeholder=""
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              error={errors.matricule}
            />
          </div>

          <div className="signup-row">
            <FormInput
              id="signup-phone"
              label="Téléphone"
              type="tel"
              placeholder=""
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
              autoComplete="tel"
            />

            <FormInput
              id="signup-enfant"
              label="Enfants"
              type="number"
              placeholder=""
              value={String(enfant)}
              onChange={(e) => setEnfant(Number(e.target.value))}
              min={0}
            />
          </div>

          <div className="signup-row">
            <div className="form-input-group">
              <label className="form-input-label">Marié(e)</label>
              <select
                className="form-input"
                style={{ width: '100%' }}
                value={marie ? 'true' : 'false'}
                onChange={(e) => setMarie(e.target.value === 'true')}
              >
                <option value="false">Non</option>
                <option value="true">Oui</option>
              </select>
            </div>
            {/* Empty div to maintain grid of 2 */}
            <div></div>
          </div>
        </div>

        <div className="signup-section">
          <div className="signup-row">
            <PasswordInput
              id="signup-password"
              label="Mot de passe"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="new-password"
            />

            <PasswordInput
              id="signup-confirm"
              label="Confirmation"
              placeholder=""
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
          </div>
          <div style={{ marginTop: '-0.5rem' }}>
            <PasswordStrength password={password} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Checkbox
            label="J'accepte les conditions d'utilisation et la politique de confidentialité."
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            aria-invalid={Boolean(errors.acceptedTerms)}
          />
          {errors.acceptedTerms && (
            <p style={{ color: '#b91c1c', fontSize: '0.76rem', fontWeight: 600, margin: 0, marginLeft: '1.5rem' }}>
              {errors.acceptedTerms}
            </p>
          )}
        </div>

        <button type="submit" className="auth-submit-btn" disabled={isLoading}>
          S'inscrire
        </button>
      </form>

      <p className="auth-switch-text">
        Vous avez déjà un compte ? <Link to="/login" className="text-gradient-link">Se connecter</Link>
      </p>
    </AuthLayout>
  );
}
