import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  Clock3,
  CreditCard,
  Hash,
  History,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../../../../shared/layout/PageHeader';
import { DataTable } from '../../../../shared/data/DataTable';
import { StatusBadge } from '../../../../shared/data/StatusBadge';
import { adhesionApi } from '../api';
import type { Adhesion } from '../../../../shared/types/domain';
import '../../profile/pages/AdherentAccountPages.css';

export function AdherentAdhesionPage() {
  const { data: adhesion, isLoading: adhesionLoading } = useQuery({
    queryKey: ['adherent-adhesion'],
    queryFn: () => adhesionApi.getCurrentAdhesion(),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['adherent-adhesion-history'],
    queryFn: () => adhesionApi.getAdhesionHistory(),
  });

  const activeHistory = (history ?? []).filter((item) => item.statut === 'active');
  const pendingDemande = (history ?? []).find((item) => item.statut === 'en_attente');
  const expiryDays = adhesion?.dateFin ? getDaysUntil(adhesion.dateFin) : null;
  const isExpiringSoon = expiryDays !== null && expiryDays <= 5 && expiryDays > 0;
  const isExpired = expiryDays !== null && expiryDays <= 0;

  const historyColumns = [
    {
      key: 'dateDebut',
      header: 'Début',
      cell: (item: Adhesion) => formatDate(item.dateDebut),
    },
    {
      key: 'dateFin',
      header: 'Fin',
      cell: (item: Adhesion) => formatDate(item.dateFin),
    },
    {
      key: 'montantCotisation',
      header: 'Cotisation',
      cell: (item: Adhesion) => <span className="adh-account-num">{formatCurrency(item.montantCotisation)} / mois</span>,
      align: 'right' as const,
    },
    {
      key: 'statut',
      header: 'Statut',
      cell: (item: Adhesion) => <StatusBadge status={item.statut} />,
    },
  ];

  return (
    <div className="adh-account-page">
      <PageHeader
        title="Mon adhésion"
        description="Votre statut d'adhésion à l'Amicale SRT et son historique."
      />

      {adhesionLoading ? (
        <div className="adh-membership-skeleton skeleton" />
      ) : adhesion ? (
        <section className="adh-membership-card">
          <header className="adh-membership-head">
            <div className="adh-membership-title">
              <span className="adh-membership-icon">
                <BadgeCheck size={24} />
              </span>
              <div>
                <span className="adh-account-kicker">Statut adhésion</span>
                <h2>Adhésion active</h2>
                <p>Renouvellement automatique avec retenue mensuelle.</p>
              </div>
            </div>

            {(isExpiringSoon || isExpired) && (
              <span className={`adh-membership-alert ${isExpired ? 'is-danger' : 'is-warning'}`}>
                <AlertTriangle size={16} />
                {isExpired ? 'Renouvellement en cours' : `Renouvellement dans ${expiryDays} j`}
              </span>
            )}
          </header>

          <div className="adh-membership-detail-grid">
            <MembershipDetail icon={Hash} label="Référence" value={adhesion.id} />
            <MembershipDetail icon={Calendar} label="Date de début" value={formatDate(adhesion.dateDebut)} />
            <MembershipDetail icon={Calendar} label="Date de fin" value={formatDate(adhesion.dateFin)} />
            <MembershipDetail icon={CreditCard} label="Cotisation mensuelle" value={formatCurrency(adhesion.montantCotisation)} />
          </div>

          <div className="adh-membership-note">
            <RefreshCw size={17} />
            <div>
              <strong>Renouvellement automatique</strong>
              <span>
                La cotisation de {formatCurrency(adhesion.montantCotisation)} est prélevée sur votre salaire
                au début de chaque mois.
              </span>
            </div>
          </div>
        </section>
      ) : pendingDemande ? (
        <section className="adh-empty-card adh-account-empty">
          <div className="adh-empty-icon">
            <Clock3 size={24} />
          </div>
          <h3>Demande en cours de validation</h3>
          <p>
            Votre demande soumise le {formatDate(pendingDemande.dateDebut)} est en attente de validation.
            La cotisation de {formatCurrency(pendingDemande.montantCotisation)} sera prélevée après acceptation.
          </p>
        </section>
      ) : (
        <section className="adh-empty-card adh-account-empty">
          <div className="adh-empty-icon">
            <AlertTriangle size={24} />
          </div>
          <h3>Aucune adhésion enregistrée</h3>
          <p>Aucune adhésion n'est associée à votre compte pour le moment.</p>
        </section>
      )}

      <section className="adh-account-section-card">
        <header className="adh-account-section-head">
          <div>
            <h3>
              <History size={17} />
              Historique des adhésions
            </h3>
            <p>
              {activeHistory.length} période{activeHistory.length > 1 ? 's' : ''} active{activeHistory.length > 1 ? 's' : ''}
            </p>
          </div>
        </header>

        <DataTable
          columns={historyColumns}
          rows={activeHistory}
          loading={historyLoading}
          rowKey={(item) => item.id}
          emptyTitle="Aucune adhésion active"
          emptyDescription="Aucune période active à afficher pour le moment."
        />
      </section>
    </div>
  );
}

function MembershipDetail({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="adh-membership-detail">
      <span>
        <Icon size={16} />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function getDaysUntil(date: string) {
  const today = new Date();
  const endDate = new Date(date);
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  return Math.ceil((endDate.getTime() - today.getTime()) / 86400000);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'TND',
  }).format(value);
}
