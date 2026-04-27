/* ============================================
   Historique des conventions — Adherent Portal
   Shows expired / refused / cancelled / completed records.
   ============================================ */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Archive, Eye, FileText } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { DataTable } from '../../../components/data/DataTable';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { Modal } from '../../../components/data/Modal';
import { conventionsApi } from '../api/conventionsApi';
import { CONV_TYPE_LABEL } from '../conventions/conventionHelpers';
import type { Convention, ConventionType } from '../../../types/domain';

/** History row : either a refused/cancelled demande, or an expired/completed convention demande. */
interface HistoryRow {
  id: string;
  conventionId: string;
  fournisseurNom: string;
  typeKey?: ConventionType;
  dateDemande: string;
  dateDecision?: string;
  finalStatus: 'expiree' | 'refusee' | 'annulee' | 'terminee';
  motifRefus?: string;
  commentaire?: string;
  remise?: number;
  avantage?: string;
}

const FINAL_STATUS_LABEL: Record<HistoryRow['finalStatus'], string> = {
  expiree: 'Expirée',
  refusee: 'Refusée',
  annulee: 'Annulée',
  terminee: 'Terminée',
};
const FINAL_STATUS_TONE: Record<HistoryRow['finalStatus'], 'success' | 'error' | 'neutral' | 'warning'> = {
  expiree: 'neutral',
  refusee: 'error',
  annulee: 'neutral',
  terminee: 'success',
};

export function AdherentHistoriqueConventionsPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<HistoryRow | null>(null);

  const { data: conventions, isLoading: convLoading } = useQuery({
    queryKey: ['adherent-conventions'],
    queryFn: () => conventionsApi.getConventions(),
  });
  const { data: demandes, isLoading: demandesLoading } = useQuery({
    queryKey: ['adherent-conventions-demandes'],
    queryFn: () => conventionsApi.getMyDemandes(),
  });
  const isLoading = convLoading || demandesLoading;

  const conventionMap = useMemo(() => {
    const map = new Map<string, Convention>();
    (conventions || []).forEach((c) => map.set(c.id, c));
    return map;
  }, [conventions]);

  const rows: HistoryRow[] = useMemo(() => {
    if (!demandes) return [];
    const today = new Date();
    const out: HistoryRow[] = [];
    demandes.forEach((d) => {
      const conv = conventionMap.get(d.conventionId);
      const snap = d.conventionSnapshot;
      const fournisseurNom = conv?.fournisseurNom || snap?.fournisseurNom || '—';
      const typeKey = (conv?.type || snap?.type) as HistoryRow['typeKey'] | undefined;
      const remise = conv?.remise ?? snap?.remise;
      const avantage = conv?.avantage || snap?.avantage;

      const finExpiree = conv ? new Date(conv.dateFin) < today : false;

      let finalStatus: HistoryRow['finalStatus'] | null = null;
      if (d.statut === 'refusee') finalStatus = 'refusee';
      else if (d.statut === 'annulee') finalStatus = 'annulee';
      else if (d.statut === 'validee' && finExpiree) finalStatus = 'terminee';
      else if (d.statut === 'en_attente' && finExpiree) finalStatus = 'expiree';

      if (!finalStatus) return;

      out.push({
        id: d.id,
        conventionId: d.conventionId,
        fournisseurNom,
        typeKey,
        dateDemande: d.dateDemande,
        dateDecision: d.dateDecision,
        finalStatus,
        motifRefus: d.motifRefus,
        commentaire: d.commentaire,
        remise,
        avantage,
      });
    });
    return out.sort((a, b) =>
      (b.dateDecision || b.dateDemande).localeCompare(a.dateDecision || a.dateDemande)
    );
  }, [demandes, conventionMap]);

  const columns = [
    {
      key: 'fournisseur',
      header: 'Fournisseur',
      cell: (r: HistoryRow) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.fournisseurNom}</div>
          {r.typeKey && (
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
              {CONV_TYPE_LABEL[r.typeKey]}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'avantage',
      header: 'Avantage',
      cell: (r: HistoryRow) =>
        r.avantage || (r.remise != null ? `${r.remise}%` : '—'),
      width: '180px',
    },
    {
      key: 'dateDemande',
      header: 'Date demande',
      cell: (r: HistoryRow) => new Date(r.dateDemande).toLocaleDateString('fr-FR'),
      width: '130px',
    },
    {
      key: 'dateDecision',
      header: 'Date validation/refus',
      cell: (r: HistoryRow) =>
        r.dateDecision ? new Date(r.dateDecision).toLocaleDateString('fr-FR') : '—',
      width: '160px',
    },
    {
      key: 'statut',
      header: 'Statut final',
      cell: (r: HistoryRow) => (
        <StatusBadge
          status={r.finalStatus}
          tone={FINAL_STATUS_TONE[r.finalStatus]}
          label={FINAL_STATUS_LABEL[r.finalStatus]}
        />
      ),
      width: '130px',
    },
    {
      key: 'motif',
      header: 'Motif',
      cell: (r: HistoryRow) =>
        r.motifRefus
          ? <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-error-700)' }}>{r.motifRefus}</span>
          : <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>,
    },
    {
      key: 'actions',
      header: '',
      cell: (r: HistoryRow) => (
        <Button variant="ghost" size="sm" onClick={() => setSelected(r)}>
          <Eye size={14} style={{ marginRight: 6 }} />
          Détails
        </Button>
      ),
      width: '120px',
      align: 'right' as const,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Historique des conventions"
        description="Vos anciennes demandes : expirées, refusées, annulées ou terminées."
      />

      {isLoading ? (
        <div className="skeleton" style={{ height: 320, borderRadius: 'var(--radius-lg)' }} />
      ) : rows.length === 0 ? (
        <div className="adh-empty-card">
          <div className="adh-empty-icon"><Archive size={28} /></div>
          <h3>Aucun historique pour le moment.</h3>
          <p>Les conventions terminées, expirées, refusées ou annulées apparaîtront ici.</p>
          <Button variant="secondary" onClick={() => navigate('/adherent/conventions')} style={{ marginTop: 'var(--space-3)' }}>
            Voir les conventions disponibles
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          emptyTitle="Aucun historique"
          emptyDescription="Les anciennes conventions apparaîtront ici."
        />
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? selected.fournisseurNom : ''}
        description="Détails de l'historique"
        size="md"
        footer={
          selected ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
              <Button variant="secondary" onClick={() => setSelected(null)}>Fermer</Button>
              <Button onClick={() => { setSelected(null); navigate(`/adherent/conventions/${selected.conventionId}`); }}>
                <FileText size={16} style={{ marginRight: 6 }} />
                Voir la convention
              </Button>
            </div>
          ) : null
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="adh-demande-summary">
              {selected.typeKey && (
                <div>
                  <span>Type</span>
                  <strong>{CONV_TYPE_LABEL[selected.typeKey]}</strong>
                </div>
              )}
              <div>
                <span>Date demande</span>
                <strong>{new Date(selected.dateDemande).toLocaleDateString('fr-FR')}</strong>
              </div>
              {selected.dateDecision && (
                <div>
                  <span>Date validation/refus</span>
                  <strong>{new Date(selected.dateDecision).toLocaleDateString('fr-FR')}</strong>
                </div>
              )}
              {selected.avantage && (
                <div>
                  <span>Avantage</span>
                  <strong style={{ color: 'var(--color-success-700)' }}>{selected.avantage}</strong>
                </div>
              )}
              <div>
                <span>Statut final</span>
                <strong>
                  <StatusBadge
                    status={selected.finalStatus}
                    tone={FINAL_STATUS_TONE[selected.finalStatus]}
                    label={FINAL_STATUS_LABEL[selected.finalStatus]}
                  />
                </strong>
              </div>
            </div>

            {selected.motifRefus && (
              <div className="adh-alert error">
                <div>
                  <strong>Motif du refus</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-sm)' }}>{selected.motifRefus}</p>
                </div>
              </div>
            )}
            {selected.commentaire && (
              <section>
                <h4 style={{
                  margin: '0 0 8px', fontSize: 'var(--font-size-xs)', fontWeight: 700,
                  color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  Votre commentaire
                </h4>
                <p style={{
                  margin: 0, padding: 'var(--space-3)',
                  background: 'var(--color-surface-secondary)',
                  borderLeft: '3px solid var(--color-primary-300)',
                  borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-primary)',
                  fontStyle: 'italic',
                }}>{selected.commentaire}</p>
              </section>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
