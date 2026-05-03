import { Link, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import './PendingApprovalPage.css';

interface LocationState {
  email?: string;
  firstName?: string;
}

export function PendingApprovalPage() {
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? {};
  const email = state.email;
  const firstName = state.firstName;

  return (
    <AuthLayout>
      <div className="pending-approval">
        <div className="pending-approval__icon" aria-hidden="true">
          {/* Hourglass icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 22h14" />
            <path d="M5 2h14" />
            <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
            <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
          </svg>
        </div>

        <h1 className="pending-approval__title text-gradient-link">
          Compte en attente de validation
        </h1>

        <p className="pending-approval__lead">
          {firstName ? `Bonjour ${firstName}, votre` : 'Votre'} compte a bien été
          créé et une <strong>demande d'adhésion</strong> a été transmise au
          trésorier. Une fois la demande <strong>validée par le trésorier</strong>,
          votre compte sera activé et vous pourrez vous connecter. Une cotisation
          mensuelle de <strong>30 TND</strong> sera alors automatiquement
          prélevée sur votre salaire.
        </p>

        {email && (
          <div className="pending-approval__email-box">
            <span className="pending-approval__email-label">Adresse e-mail&nbsp;:</span>
            <span className="pending-approval__email-value">{email}</span>
          </div>
        )}

        <div className="pending-approval__steps">
          <h3 className="pending-approval__steps-title">Et maintenant&nbsp;?</h3>
          <ol className="pending-approval__steps-list">
            <li>
              Le trésorier de l'Amicale SRT va examiner votre demande d'adhésion
              dans les plus brefs délais.
            </li>
            <li>
              Vous recevrez une confirmation lorsque votre compte sera activé.
            </li>
            <li>
              Vous pourrez ensuite vous connecter avec votre adresse e-mail et
              votre mot de passe.
            </li>
          </ol>
        </div>

        <div className="pending-approval__actions">
          <Link to="/login" className="auth-submit-btn gradient-primary">
            Retour à la connexion
          </Link>
        </div>

        <p className="pending-approval__help">
          Une question&nbsp;? Contactez le trésorier de l'Amicale SRT.
        </p>
      </div>
    </AuthLayout>
  );
}
