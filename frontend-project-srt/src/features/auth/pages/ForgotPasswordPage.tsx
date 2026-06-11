import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { FormInput } from '../../../shared/ui/FormInput';
import { PasswordInput } from '../../../shared/ui/PasswordInput';
import { PasswordStrength } from '../../../shared/ui/PasswordStrength';
import { Alert } from '../../../shared/ui/Alert';
import { validateConfirmPassword, validateEmail, validatePassword } from '../utils/validation';
import type { ValidationErrors } from '../types/auth.types';

type ForgotPasswordStep = 'email' | 'code' | 'success';

export function ForgotPasswordPage() {
  const { forgotPassword, resetPassword } = useAuth();

  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    const emailError = validateEmail(email);
    setErrors(emailError ? { email: emailError } : {});
    if (emailError) return;

    setIsLoading(true);
    try {
      await forgotPassword(email);
      setStep('code');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validateResetForm();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    try {
      await resetPassword(email, code, password);
      setStep('success');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateResetForm = (): ValidationErrors => {
    const validationErrors: ValidationErrors = {};

    if (!/^\d{6}$/.test(code)) {
      validationErrors.code = 'Le code doit contenir 6 chiffres';
    }

    const passwordError = validatePassword(password);
    if (passwordError) validationErrors.password = passwordError;

    const confirmError = validateConfirmPassword(password, confirmPassword);
    if (confirmError) validationErrors.confirmPassword = confirmError;

    return validationErrors;
  };

  const handleCodeChange = (value: string) => {
    setCode(value.replace(/\D/g, '').slice(0, 6));
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCode('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setServerError('');
  };

  return (
    <AuthLayout heroImage="login2">
      <div className="auth-page">
        {step === 'success' ? (
          <div className="auth-success">
            <div className="auth-success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="auth-title">Mot de passe reinitialise</h2>
            <p className="auth-helper-text">
              Votre mot de passe a ete modifie avec succes. Vous pouvez maintenant vous connecter.
            </p>
            <Link to="/login" className="text-gradient-link">
              Retour a la connexion
            </Link>
          </div>
        ) : (
          <>
            <h1 className="auth-title">Mot de passe oublie ?</h1>
            <p className="auth-helper-text auth-helper-text--intro">
              {step === 'email'
                ? 'Entrez votre email pour recevoir un code de reinitialisation.'
                : `Entrez le code envoye a ${email}, puis choisissez un nouveau mot de passe.`}
            </p>

            {serverError && (
              <div className="auth-error-alert">
                <Alert variant="error" dismissible onDismiss={() => setServerError('')}>
                  {serverError}
                </Alert>
              </div>
            )}

            {step === 'email' ? (
              <form className="auth-form-fields" onSubmit={handleSendCode} noValidate>
                <FormInput
                  id="forgot-email"
                  label="Adresse email"
                  type="email"
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  autoComplete="email"
                  icon={<Mail size={18} />}
                />
                <button type="submit" className="auth-submit-btn gradient-primary" disabled={isLoading}>
                  Envoyer le code
                </button>
              </form>
            ) : (
              <form className="auth-form-fields" onSubmit={handleResetPassword} noValidate>
                <FormInput
                  id="reset-code"
                  label="Code recu par email"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder=""
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  error={errors.code}
                  autoComplete="one-time-code"
                  icon={<KeyRound size={18} />}
                />

                <PasswordInput
                  id="reset-password"
                  label="Nouveau mot de passe"
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  autoComplete="new-password"
                />

                <div className="auth-password-strength-offset">
                  <PasswordStrength password={password} />
                </div>

                <PasswordInput
                  id="reset-confirm"
                  label="Confirmer le mot de passe"
                  placeholder=""
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                />

                <button type="submit" className="auth-submit-btn gradient-primary" disabled={isLoading}>
                  Reinitialiser le mot de passe
                </button>

                <button
                  type="button"
                  className="text-gradient-link auth-plain-action"
                  onClick={handleBackToEmail}
                  disabled={isLoading}
                >
                  Changer d'email
                </button>
              </form>
            )}

            <p className="auth-switch-text">
              <Link to="/login" className="text-gradient-link">
                Retour a la connexion
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
