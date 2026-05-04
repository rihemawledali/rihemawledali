import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Ticket } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/data/StatusBadge';
import { useToast } from '../../components/feedback/useToast';
import { bonsCommandeApi } from './offersApi';
import { formatCurrency, formatDate, formatNumber } from '../../lib/formatters';
import type { BonStatus } from '../../types/domain';
import '../../components/layout/CrudPage.css';
import './OffersPages.css';

const BON_STATUS_LABEL: Record<BonStatus, string> = {
  brouillon: 'Brouillon',
  valide: 'Valide',
  epuise: 'Epuise',
  expire: 'Expire',
  en_attente: 'En attente',
  attribue: 'Attribue',
  utilise: 'Utilise',
};

const BON_STATUS_TONE: Record<BonStatus, 'neutral' | 'info' | 'success' | 'warning' | 'error'> = {
  brouillon: 'warning',
  valide: 'success',
  epuise: 'neutral',
  expire: 'error',
  en_attente: 'warning',
  attribue: 'info',
  utilise: 'success',
};

export function BonCommandeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const toast = useToast();
  const basePath = location.pathname.startsWith('/admin')
    ? '/admin/offres/bons-commande'
    : '/treasurer/bons-commande';
  const ticketPath = location.pathname.startsWith('/admin')
    ? '/admin/offres/tickets'
    : '/treasurer/tickets';

  const query = useQuery({
    queryKey: ['bons-commande', 'detail', id],
    queryFn: () => bonsCommandeApi.detail(id ?? ''),
    enabled: !!id,
  });

  const valider = useMutation({
    mutationFn: (bonId: string) => bonsCommandeApi.valider(bonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bons-commande'] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
      toast.push({ title: 'Bon de commande valide', variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const bon = query.data?.bon;

  if (query.isLoading) {
    return (
      <div className="offers-page">
        <PageHeader title="Bon de commande" description="Chargement du dossier..." />
        <div className="data-table-card" />
      </div>
    );
  }

  if (!bon) {
    return (
      <div className="offers-page">
        <PageHeader
          title="Bon de commande introuvable"
          description="Le dossier demande n'existe pas ou n'est plus disponible."
          actions={<Button variant="secondary" onClick={() => navigate(basePath)}><ArrowLeft size={16} /> Retour</Button>}
        />
      </div>
    );
  }

  return (
    <div className="offers-page">
      <PageHeader
        title={`Bon ${bon.numero}`}
        description={`${bon.fournisseurNom || 'Fournisseur non renseigne'} - ${bon.typeBon === 'cafeteria' ? 'Cafeteria' : 'Restaurant'}`}
        breadcrumb={['Tresorerie', 'Offres', 'Bons de commande', bon.numero]}
        actions={(
          <div className="offer-header-actions">
            <Button variant="secondary" onClick={() => navigate(basePath)}>
              <ArrowLeft size={16} />
              Retour
            </Button>
            {bon.statut === 'brouillon' && (
              <Button onClick={() => valider.mutate(bon.id)} isLoading={valider.isPending}>
                <CheckCircle2 size={16} />
                Valider
              </Button>
            )}
            {bon.statut === 'valide' && (
              <Button onClick={() => navigate(ticketPath, { state: { bonCommandeId: bon.id } })}>
                <Ticket size={16} />
                Attribuer
              </Button>
            )}
          </div>
        )}
      />

      <section className="offer-detail-hero">
        <div>
          <span className="offer-eyebrow">Stock global</span>
          <h2>{formatCurrency(bon.montant)}</h2>
          <p>{formatNumber(bon.quantiteTotale ?? 0)} tickets x {formatCurrency(bon.valeurUnitaire ?? 0)}</p>
        </div>
        <StatusBadge
          status={bon.statut}
          tone={BON_STATUS_TONE[bon.statut]}
          label={BON_STATUS_LABEL[bon.statut] ?? bon.statut}
        />
      </section>

      <section className="offers-metrics">
        <OfferDetailMetric label="Quantite totale" value={formatNumber(bon.quantiteTotale ?? 0)} />
        <OfferDetailMetric label="Tickets restants" value={formatNumber(bon.quantiteRestante ?? 0)} />
        <OfferDetailMetric label="Tickets attribues" value={formatNumber(bon.quantiteAttribuee ?? 0)} />
        <OfferDetailMetric label="Expiration" value={formatDate(bon.dateExpiration)} />
      </section>
    </div>
  );
}

function OfferDetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="offer-metric offer-metric--primary">
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
