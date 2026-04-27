import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { FormInput } from '../../../components/ui/FormInput';
import { Alert } from '../../../components/ui/Alert';
import { validateEmail } from '../utils/validation';

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
      {isSuccess ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '9999px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', marginBottom: '1.5rem' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h2 className="auth-title">Vérifiez vos e-mails</h2>
          <p style={{ color: 'var(--auth-text-dim)', marginBottom: '2rem' }}>
            Nous avons envoyé un lien de réinitialisation de mot de passe à <strong>{email}</strong>.
            Veuillez consulter votre boîte de réception et suivre les instructions.
          </p>
          <Link to="/login" className="text-gradient-link">
            &larr; Retour à la connexion
          </Link>
        </div>
      ) : (
        <>
          <h1 className="auth-title">Mot de passe oublié ?</h1>
          <p style={{ color: 'var(--auth-text-dim)', marginBottom: '2rem', marginTop: '-1rem' }}>
            Pas de soucis. Entrez votre adresse e-mail et nous vous enverrons un lien de réinitialisation.
          </p>

          {error && (
            <div className="auth-error-alert">
              <Alert variant="error" dismissible onDismiss={() => setError('')}>
                {error}
              </Alert>
            </div>
          )}

          <form className="auth-form-fields" onSubmit={handleSubmit} noValidate>
            <FormInput
              id="forgot-email"
              label="Email address"
              type="email"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error=""
              autoComplete="email"
            />
            <button type="submit" className="auth-submit-btn gradient-primary" disabled={isLoading}>
              Envoyer le lien
            </button>
          </form>

          <p className="auth-switch-text" style={{ textAlign: 'center' }}>
            <Link to="/login" className="text-gradient-link">
              &larr; Retour à la connexion
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
