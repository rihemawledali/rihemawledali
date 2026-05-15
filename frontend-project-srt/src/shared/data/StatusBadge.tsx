import './StatusBadge.css';

export type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

const STATUS_TONE: Record<string, BadgeTone> = {
  // generic
  actif: 'success', active: 'success', reussi: 'success', payee: 'success',
  utilise: 'info', attribue: 'primary', approuvee: 'success', rembourse: 'success',
  inactif: 'neutral', expiree: 'neutral', expire: 'neutral',
  en_attente: 'warning', en_negociation: 'warning', partielle: 'warning',
  suspendu: 'error', suspendue: 'error', echoue: 'error', rejete: 'error', rejetee: 'error',
  impayee: 'error', en_retard: 'error', en_cours: 'info',
  payee_: 'success',
};

const STATUS_LABEL: Record<string, string> = {
  actif: 'Actif', inactif: 'Inactif', suspendu: 'Suspendu',
  active: 'Active', expiree: 'Expirée', en_negociation: 'En négociation', suspendue: 'Suspendue',
  en_cours: 'En cours', rembourse: 'Remboursé', en_retard: 'En retard',
  en_attente: 'En attente', rejete: 'Rejeté', rejetee: 'Rejetée', approuvee: 'Approuvée', payee: 'Payée',
  reussi: 'Réussi', echoue: 'Échoué',
  attribue: 'Attribué', utilise: 'Utilisé', expire: 'Expiré',
  impayee: 'Impayée', partielle: 'Partielle',
};

interface StatusBadgeProps {
  status: string;
  tone?: BadgeTone;
  label?: string;
}

export function StatusBadge({ status, tone, label }: StatusBadgeProps) {
  const t = tone ?? STATUS_TONE[status] ?? 'neutral';
  const text = label ?? STATUS_LABEL[status] ?? status;
  return <span className={`badge badge--${t}`}>{text}</span>;
}
