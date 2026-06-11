import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Calendar,
  Clock3,
  CreditCard,
  Hash,
  History,
} from 'lucide-react';
import { PageHeader } from '../../../../shared/layout/PageHeader';
import { DataTable } from '../../../../shared/data/DataTable';
import { StatusBadge } from '../../../../shared/data/StatusBadge';
import { formatCurrency, formatDate } from '../../../../shared/lib/formatters';
import { adhesionApi } from '../api';
import type { Adhesion } from '../../../../shared/types/domain';
import './AdherentAdhesionPage.css';

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
      cell: (item: Adhesion) => <span className="adh-adhesion-num">{formatCurrency(item.montantCotisation)} / mois</span>,
      align: 'right' as const,
    },
    {
      key: 'statut',
      header: 'Statut',
      cell: (item: Adhesion) => <StatusBadge status={item.statut} />,
    },
  ];

  return (
    <div className="adh-adhesion-page">
      <PageHeader
        title="Mon adhésion"
        description="Votre statut d'adhésion à l'Amicale SRT et son historique."
      />

      {adhesionLoading ? (
        <div className="adh-adhesion-skeleton skeleton" />
      ) : adhesion ? (
        <section className="adh-adhesion-card">
          <div className="adh-adhesion-detail-grid">
            <MembershipDetail icon={Hash} label="Référence" value={adhesion.id} />
            <MembershipDetail icon={Calendar} label="Date de début" value={formatDate(adhesion.dateDebut)} />
            <MembershipDetail icon={Calendar} label="Date de fin" value={formatDate(adhesion.dateFin)} />
            <MembershipDetail icon={CreditCard} label="Cotisation mensuelle" value={formatCurrency(adhesion.montantCotisation)} />
          </div>
        </section>
      ) : pendingDemande ? (
        <section className="adh-empty-card adh-adhesion-empty">
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
        <section className="adh-empty-card adh-adhesion-empty">
          <div className="adh-empty-icon">
            <AlertTriangle size={24} />
          </div>
          <h3>Aucune adhésion enregistrée</h3>
          <p>Aucune adhésion n'est associée à votre compte pour le moment.</p>
        </section>
      )}

      <section className="adh-adhesion-section-card">
        <header className="adh-adhesion-section-head">
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
    <div className="adh-adhesion-detail">
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
