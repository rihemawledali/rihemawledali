/* ============================================
   Treasurer — Retenue mensuelle detail
   ============================================ */

import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Hash, User, Calendar, ListChecks, BadgeCheck,
  CheckCircle2, ArrowRight, AlertTriangle, Building2, Banknote, HandCoins,
  Download, Undo2, Ticket, Receipt,
} from 'lucide-react';
import { PageHeader } from '../../../shared/layout/PageHeader';
import { Button } from '../../../shared/ui/Button';
import { StatusBadge } from '../../../shared/data/StatusBadge';
import { formatCurrency, formatDate, formatNumber } from '../../../shared/lib/formatters';
import {
  treasurerRetenuesApi,
  type RetenueMensuelleStatut,
  type RetenueLigne,
  type RetenueLigneStatut,
  type RetenueLigneType,
} from '../retenues/api';
import './TreasurerRetenueDetailPage.css';

const MASTER_ORDER: RetenueMensuelleStatut[] = ['GENEREE', 'EXPORTEE'];

const MASTER_LABEL: Record<RetenueMensuelleStatut, string> = {
  GENEREE: 'À exporter',
  EXPORTEE: 'Exportée',
};

const MASTER_TONE: Record<RetenueMensuelleStatut, 'info' | 'success'> = {
  GENEREE: 'info',
  EXPORTEE: 'success',
};

const LIGNE_OPTIONS: { value: RetenueLigneStatut; label: string }[] = [
  { value: 'GENEREE', label: 'Générée' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'PRELEVEE', label: 'Prélevée' },
  { value: 'ANNULEE', label: 'Annulée' },
];

const LIGNE_LABEL: Record<RetenueLigneStatut, string> = {
  GENEREE: 'Générée',
  EN_ATTENTE: 'En attente',
  PRELEVEE: 'Prélevée',
  ANNULEE: 'Annulée',
};

const LIGNE_TONE: Record<RetenueLigneStatut, 'info' | 'warning' | 'success' | 'error'> = {
  GENEREE: 'info',
  EN_ATTENTE: 'warning',
  PRELEVEE: 'success',
  ANNULEE: 'error',
};

const LINE_STATUS_ORDER: RetenueLigneStatut[] = ['GENEREE', 'EN_ATTENTE', 'PRELEVEE', 'ANNULEE'];

const TYPE_LABEL: Record<RetenueLigneType, string> = {
  COTISATION: 'Cotisation',
  PRET: 'Prêt',
  CONVENTION: 'Convention',
  TICKET_RESTAURANT: 'Ticket restaurant',
};

const TYPE_ICON: Record<RetenueLigneType, ReactNode> = {
  COTISATION: <HandCoins size={15} />,
  PRET: <Banknote size={15} />,
  CONVENTION: <Building2 size={15} />,
  TICKET_RESTAURANT: <Ticket size={15} />,
};

const TYPE_TONE: Record<RetenueLigneType, 'info' | 'warning' | 'primary' | 'success'> = {
  COTISATION: 'info',
  PRET: 'warning',
  CONVENTION: 'primary',
  TICKET_RESTAURANT: 'success',
};

function formatMonth(mois: number, annee: number): string {
  const d = new Date(annee, mois - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function safeDate(value?: string): string {
  return value ? formatDate(value) : '—';
}

export function TreasurerRetenueDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fire = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  };

  const detail = useQuery({
    queryKey: ['treasurer', 'retenues', 'detail', id],
    queryFn: () => treasurerRetenuesApi.getById(id),
    enabled: !!id,
  });

  const retenue = detail.data;

  const exportMutation = useMutation({
    mutationFn: () => treasurerRetenuesApi.exportOne(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'retenues'] });
      fire(`Export CSV prêt : ${res.filename}`);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Échec de l'export"),
  });

  const rollbackMutation = useMutation({
    mutationFn: () => treasurerRetenuesApi.setStatut(id, 'GENEREE', undefined, true),
    onSuccess: (next) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'retenues'] });
      qc.setQueryData(['treasurer', 'retenues', 'detail', id], next);
      fire('Export annulé — retour au statut « À exporter »');
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Erreur inattendue'),
  });

  const setLigneStatutMutation = useMutation({
    mutationFn: ({ ligneId, statut }: { ligneId: string; statut: RetenueLigneStatut }) =>
      treasurerRetenuesApi.setLigneStatut(id, ligneId, statut),
    onSuccess: (next) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'retenues'] });
      qc.setQueryData(['treasurer', 'retenues', 'detail', id], next);
      fire('Ligne mise à jour.');
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Échec de la mise à jour de la ligne'),
  });

  const idx = useMemo(() => (retenue ? MASTER_ORDER.indexOf(retenue.statut) : -1), [retenue]);
  const lineStats = useMemo(() => createLineStats(retenue?.lignes ?? []), [retenue]);
  const isExported = retenue?.statut === 'EXPORTEE';
  const periodLabel = retenue ? formatMonth(retenue.mois, retenue.annee) : '';
  const saving = exportMutation.isPending || rollbackMutation.isPending || setLigneStatutMutation.isPending;

  const handleExport = async () => {
    setError(null);
    try { await exportMutation.mutateAsync(); } catch { /* surfaced via mutation onError */ }
  };

  const handleRollback = async () => {
    setError(null);
    try { await rollbackMutation.mutateAsync(); } catch { /* surfaced via mutation onError */ }
  };

  if (detail.isLoading) {
    return (
      <div className="treasurer-retenue-detail">
        <BackButton onBack={() => navigate('/treasurer/retenues')} label="Retour aux retenues" />
        <div className="trd-skeleton" />
      </div>
    );
  }

  if (!retenue) {
    return (
      <div className="treasurer-retenue-detail">
        <BackButton onBack={() => navigate('/treasurer/retenues')} label="Retour aux retenues" />
        <div className="trd-empty-page">
          <Receipt size={28} />
          <strong>Retenue introuvable</strong>
          <span>La retenue demandée n'est plus disponible ou n'a pas encore été générée.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="treasurer-retenue-detail">
      <BackButton onBack={() => navigate('/treasurer/retenues')} label="Retour aux retenues" />

      <PageHeader
        title={`Retenue ${periodLabel} — ${retenue.adherentNom}`}
        description={`Référence ${retenue.id}`}
        breadcrumb={['Trésorerie', 'Finance', 'Retenues', retenue.id]}
        actions={(
          <div className="trd-header-actions">
            {isExported && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRollback}
                disabled={saving}
                title="Annuler l'export — retour à « À exporter »"
              >
                <Undo2 size={14} />
                Annuler l'export
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleExport}
              isLoading={exportMutation.isPending}
              disabled={saving}
              title={isExported ? 'Télécharger à nouveau le CSV' : 'Générer le CSV et marquer comme exportée'}
            >
              <Download size={14} />
              {isExported ? 'Télécharger à nouveau' : 'Exporter CSV'}
            </Button>
          </div>
        )}
      />

      {error && (
        <div className="trd-alert" role="alert">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <section className="trd-hero" aria-label="Résumé de la retenue">
        <div className="trd-hero-main">
          <span className="trd-kicker">Retenue mensuelle</span>
          <div className="trd-hero-title">
            <h2>{retenue.adherentNom}</h2>
            <StatusBadge
              status={retenue.statut}
              tone={MASTER_TONE[retenue.statut]}
              label={MASTER_LABEL[retenue.statut]}
            />
          </div>
          <p>
            Contrôle détaillé des retenues à prélever sur la paie de {periodLabel}, avec statut par source et ventilation claire des lignes.
          </p>
        </div>
        <div className="trd-total-panel">
          <span>Total retenu</span>
          <strong>{formatCurrency(retenue.totalRetenu)}</strong>
          <small>{formatNumber(lineStats.activeCount)} ligne{lineStats.activeCount > 1 ? 's' : ''} active{lineStats.activeCount > 1 ? 's' : ''}</small>
        </div>
      </section>

      <section className="trd-detail-grid" aria-label="Informations principales">
        <DetailTile icon={<Hash size={15} />} label="Référence" value={retenue.id} mono />
        <DetailTile
          icon={<User size={15} />}
          label="Adhérent"
          value={retenue.adherentNom}
          meta={retenue.adherentMatricule || 'Sans matricule'}
        />
        <DetailTile icon={<Calendar size={15} />} label="Période" value={periodLabel} />
        <DetailTile icon={<Calendar size={15} />} label="Génération" value={safeDate(retenue.dateGeneration)} />
        <DetailTile icon={<Download size={15} />} label="Export" value={safeDate(retenue.dateExport)} />
      </section>

      <div className="trd-main-grid">
        <section className="trd-card trd-card--workflow">
          <SectionHeader
            title="Workflow"
            subtitle="Statut global de la retenue avant transmission au fichier paie."
          />
          <WorkflowStepper currentIndex={idx} />
        </section>

        <section className="trd-breakdown-grid" aria-label="Ventilation par source">
          <BreakdownCard icon={<HandCoins size={17} />} label="Cotisation" count={lineStats.byType.COTISATION.count} total={lineStats.byType.COTISATION.total} tone="info" />
          <BreakdownCard icon={<Banknote size={17} />} label="Prêt" count={lineStats.byType.PRET.count} total={lineStats.byType.PRET.total} tone="warning" />
          <BreakdownCard icon={<Building2 size={17} />} label="Convention" count={lineStats.byType.CONVENTION.count} total={lineStats.byType.CONVENTION.total} tone="primary" />
          <BreakdownCard icon={<Ticket size={17} />} label="Ticket restaurant" count={lineStats.byType.TICKET_RESTAURANT.count} total={lineStats.byType.TICKET_RESTAURANT.total} tone="success" />
        </section>

        <section className="trd-card trd-lines-card">
          <SectionHeader
            title={`Lignes de retenue (${formatNumber(retenue.lignes.length)})`}
            subtitle="Chaque ligne peut être suivie et ajustée selon son état de prélèvement."
          />
          <LineStatusStrip stats={lineStats} />
          {retenue.lignes.length === 0 ? (
            <div className="trd-empty-state">
              <ListChecks size={22} />
              <strong>Aucune ligne pour ce mois</strong>
              <span>Régénérez la période si une cotisation ou un prêt devrait apparaître.</span>
            </div>
          ) : (
            <div className="trd-table-scroll">
              <table className="trd-lines-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Motif et source</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Modifier</th>
                  </tr>
                </thead>
                <tbody>
                  {retenue.lignes.map((ligne) => (
                    <LigneRow
                      key={ligne.id}
                      ligne={ligne}
                      saving={saving}
                      onChange={(next) => setLigneStatutMutation.mutateAsync({ ligneId: ligne.id, statut: next })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {toast && <div className="trd-toast">{toast}</div>}
    </div>
  );
}

function BackButton({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <div className="trd-back-row">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={14} />
        {label}
      </Button>
    </div>
  );
}

function WorkflowStepper({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="trd-workflow" aria-label="Workflow de la retenue">
      {MASTER_ORDER.map((statut, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;
        return (
          <div key={statut} className="trd-workflow-step">
            <span className={current ? 'is-current' : done ? 'is-done' : undefined}>
              {done ? <CheckCircle2 size={15} /> : <BadgeCheck size={15} />}
              {MASTER_LABEL[statut]}
            </span>
            {index < MASTER_ORDER.length - 1 && <ArrowRight size={15} />}
          </div>
        );
      })}
    </div>
  );
}

function LigneRow({ ligne, onChange, saving }: {
  ligne: RetenueLigne;
  onChange: (next: RetenueLigneStatut) => Promise<unknown>;
  saving: boolean;
}) {
  const [pending, setPending] = useState(false);

  const handle = async (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as RetenueLigneStatut;
    if (next === ligne.statut) return;
    setPending(true);
    try { await onChange(next); }
    finally { setPending(false); }
  };

  return (
    <tr className={ligne.statut === 'ANNULEE' ? 'is-muted' : undefined}>
      <td>
        <span className={`trd-type-pill trd-type-pill--${TYPE_TONE[ligne.typeSource]}`}>
          {TYPE_ICON[ligne.typeSource]}
          {TYPE_LABEL[ligne.typeSource]}
        </span>
      </td>
      <td>
        <div className="trd-line-desc">
          <strong>{ligne.motif || 'Retenue sans motif'}</strong>
          <span>
            Réf. {ligne.sourceRefId || '—'}
            {ligne.trancheNumero && ligne.trancheTotal ? ` · Tranche ${ligne.trancheNumero}/${ligne.trancheTotal}` : ''}
          </span>
          {ligne.commentaire && <em>{ligne.commentaire}</em>}
        </div>
      </td>
      <td className="trd-amount">{formatCurrency(ligne.montant)}</td>
      <td>
        <StatusBadge status={ligne.statut} tone={LIGNE_TONE[ligne.statut]} label={LIGNE_LABEL[ligne.statut]} />
      </td>
      <td>
        <select
          className="trd-status-select"
          value={ligne.statut}
          onChange={handle}
          disabled={saving || pending}
          aria-label={`Modifier le statut de la ligne ${ligne.motif || ligne.id}`}
        >
          {LIGNE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </td>
    </tr>
  );
}

function BreakdownCard({ icon, label, count, total, tone }: {
  icon: ReactNode;
  label: string;
  count: number;
  total: number;
  tone: 'info' | 'warning' | 'primary' | 'success';
}) {
  return (
    <article className={`trd-breakdown-card trd-breakdown-card--${tone}`}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{formatCurrency(total)}</strong>
        <small>{formatNumber(count)} ligne{count > 1 ? 's' : ''}</small>
      </div>
    </article>
  );
}

function LineStatusStrip({ stats }: { stats: LineStats }) {
  return (
    <div className="trd-status-strip" aria-label="Statuts des lignes">
      {LINE_STATUS_ORDER.map((statut) => (
        <span key={statut}>
          <StatusBadge status={statut} tone={LIGNE_TONE[statut]} label={LIGNE_LABEL[statut]} />
          <strong>{formatNumber(stats.byStatus[statut])}</strong>
        </span>
      ))}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="trd-section-header">
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  );
}

function DetailTile({ icon, label, value, meta, mono }: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="trd-detail-tile">
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong className={mono ? 'is-mono' : undefined}>{value}</strong>
        {meta && <small>{meta}</small>}
      </div>
    </div>
  );
}

interface LineStats {
  byType: Record<RetenueLigneType, { total: number; count: number }>;
  byStatus: Record<RetenueLigneStatut, number>;
  activeTotal: number;
  activeCount: number;
  averageLine: number;
}

function createLineStats(lignes: RetenueLigne[]): LineStats {
  const byType: LineStats['byType'] = {
    COTISATION: { total: 0, count: 0 },
    PRET: { total: 0, count: 0 },
    CONVENTION: { total: 0, count: 0 },
    TICKET_RESTAURANT: { total: 0, count: 0 },
  };
  const byStatus: LineStats['byStatus'] = {
    GENEREE: 0,
    EN_ATTENTE: 0,
    PRELEVEE: 0,
    ANNULEE: 0,
  };

  let activeTotal = 0;
  let activeCount = 0;

  for (const ligne of lignes) {
    byStatus[ligne.statut] += 1;
    if (ligne.statut === 'ANNULEE') continue;
    byType[ligne.typeSource].count += 1;
    byType[ligne.typeSource].total += ligne.montant;
    activeTotal += ligne.montant;
    activeCount += 1;
  }

  return {
    byType,
    byStatus,
    activeTotal,
    activeCount,
    averageLine: activeCount ? activeTotal / activeCount : 0,
  };
}
