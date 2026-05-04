/* ============================================
   Treasurer — Retenue mensuelle (master) — full detail page
   Route: /treasurer/retenues/:id
   Replaces the previous modal-based aggregated detail.
   ============================================ */

import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Hash, User, Calendar, Wallet, ListChecks, FileText, BadgeCheck,
  CheckCircle2, ArrowRight, AlertTriangle, Building2, Banknote, HandCoins,
  Download, Undo2, Ticket,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { FormSelect } from '../../../components/ui/FormSelect';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import {
  treasurerRetenuesApi,
  type RetenueMensuelleStatut,
  type RetenueLigne,
  type RetenueLigneStatut,
  type RetenueLigneType,
} from '../api/treasurerListApi';

// ----- Master statut visuals -----

const MASTER_ORDER: RetenueMensuelleStatut[] = ['GENEREE', 'EXPORTEE'];

const MASTER_LABEL: Record<RetenueMensuelleStatut, string> = {
  GENEREE: 'À exporter',
  EXPORTEE: 'Exportée',
};

const MASTER_TONE: Record<RetenueMensuelleStatut, 'info' | 'success'> = {
  GENEREE: 'info',
  EXPORTEE: 'success',
};

// ----- Ligne statut visuals -----

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

const TYPE_LABEL: Record<RetenueLigneType, string> = {
  COTISATION: 'Cotisation',
  PRET: 'Prêt',
  CONVENTION: 'Convention',
  TICKET_RESTAURANT: 'Ticket restaurant',
};

const TYPE_ICON: Record<RetenueLigneType, React.ReactNode> = {
  COTISATION: <HandCoins size={14} />,
  PRET: <Banknote size={14} />,
  CONVENTION: <Building2 size={14} />,
  TICKET_RESTAURANT: <Ticket size={14} />,
};

function formatMonth(mois: number, annee: number): string {
  const d = new Date(annee, mois - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
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

  // ----- Queries -----
  const detail = useQuery({
    queryKey: ['treasurer', 'retenues', 'detail', id],
    queryFn: () => treasurerRetenuesApi.getById(id),
    enabled: !!id,
  });

  const retenue = detail.data;

  const history = useQuery({
    queryKey: ['treasurer', 'retenues', 'history', retenue?.adherentId],
    queryFn: () => treasurerRetenuesApi.historyForAdherent(retenue!.adherentId),
    enabled: !!retenue,
  });

  // ----- Mutations -----
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
      fire('Export annulé — retour au statut « À exporter »');
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Erreur inattendue'),
  });

  const setLigneStatutMutation = useMutation({
    mutationFn: ({ ligneId, statut }: { ligneId: string; statut: RetenueLigneStatut }) =>
      treasurerRetenuesApi.setLigneStatut(id, ligneId, statut),
    onSuccess: (next) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'retenues'] });
      qc.setQueryData(['treasurer', 'retenues', 'detail', id], next);
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Échec de la mise à jour de la ligne'),
  });

  // ----- Workflow controls -----
  const idx = useMemo(() => (retenue ? MASTER_ORDER.indexOf(retenue.statut) : -1), [retenue]);
  const isExported = retenue?.statut === 'EXPORTEE';

  const handleExport = async () => {
    setError(null);
    try { await exportMutation.mutateAsync(); } catch { /* surfaced via mutation onError */ }
  };
  const handleRollback = async () => {
    setError(null);
    try { await rollbackMutation.mutateAsync(); } catch { /* surfaced via mutation onError */ }
  };

  const saving = exportMutation.isPending || rollbackMutation.isPending || setLigneStatutMutation.isPending;

  // ----- Render -----
  if (detail.isLoading) {
    return (
      <div className="overview-page">
        <Button variant="ghost" size="sm" onClick={() => navigate('/treasurer/retenues')}>
          <ArrowLeft size={14} style={{ marginRight: 6 }} /> Retour
        </Button>
        <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-md)', marginTop: 12 }} />
      </div>
    );
  }

  if (!retenue) {
    return (
      <div className="overview-page">
        <Button variant="ghost" size="sm" onClick={() => navigate('/treasurer/retenues')}>
          <ArrowLeft size={14} style={{ marginRight: 6 }} /> Retour
        </Button>
        <div
          style={{
            marginTop: 24,
            padding: 24,
            background: 'var(--color-surface-secondary)',
            border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
          }}
        >
          Retenue introuvable.
        </div>
      </div>
    );
  }

  return (
    <div className="overview-page">
      <Button variant="ghost" size="sm" onClick={() => navigate('/treasurer/retenues')}>
        <ArrowLeft size={14} style={{ marginRight: 6 }} /> Retour aux retenues
      </Button>

      <PageHeader
        title={`Retenue ${formatMonth(retenue.mois, retenue.annee)} — ${retenue.adherentNom}`}
        description={`Référence ${retenue.id}`}
        breadcrumb={['Trésorerie', 'Finance', 'Retenues', retenue.id]}
        actions={(
          <div style={{ display: 'flex', gap: 8 }}>
            {isExported && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRollback}
                disabled={saving}
                title="Annuler l'export — retour à « À exporter »"
              >
                <Undo2 size={14} style={{ marginRight: 6 }} />
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
              <Download size={14} style={{ marginRight: 6 }} />
              {isExported ? 'Télécharger à nouveau (CSV)' : 'Exporter (CSV)'}
            </Button>
          </div>
        )}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* ---- Header summary ---- */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            background: 'white',
            border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <DetailField
            icon={<Hash size={14} />}
            label="Référence"
            value={<span style={{ fontFamily: 'var(--font-family-mono, monospace)' }}>{retenue.id}</span>}
          />
          <DetailField
            icon={<User size={14} />}
            label="Adhérent"
            value={(
              <strong>
                {retenue.adherentNom}
                {retenue.adherentMatricule && (
                  <span style={{ marginLeft: 6, color: 'var(--color-text-tertiary)', fontWeight: 400, fontSize: 12 }}>
                    · {retenue.adherentMatricule}
                  </span>
                )}
              </strong>
            )}
          />
          <DetailField
            icon={<Calendar size={14} />}
            label="Mois"
            value={formatMonth(retenue.mois, retenue.annee)}
          />
          <DetailField
            icon={<Wallet size={14} />}
            label="Total retenu"
            value={<strong style={{ fontSize: 18 }}>{formatCurrency(retenue.totalRetenu)}</strong>}
          />
          <DetailField
            icon={<BadgeCheck size={14} />}
            label="Statut"
            value={(
              <StatusBadge
                status={retenue.statut}
                tone={MASTER_TONE[retenue.statut]}
                label={MASTER_LABEL[retenue.statut]}
              />
            )}
          />
          <DetailField icon={<Calendar size={14} />} label="Génération" value={formatDate(retenue.dateGeneration)} />
          <DetailField
            icon={<Calendar size={14} />}
            label="Export"
            value={retenue.dateExport ? formatDate(retenue.dateExport) : '—'}
          />
        </div>

        {/* ---- Workflow stepper ---- */}
        <section
          style={{
            background: 'white',
            border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
          }}
        >
          <SectionTitle>Workflow</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {MASTER_ORDER.map((s, i) => {
              const done = i < idx;
              const current = i === idx;
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px',
                      borderRadius: 999,
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: current ? 700 : 500,
                      background: current
                        ? 'var(--color-primary-100)'
                        : done
                          ? 'var(--color-success-50, #ecfdf5)'
                          : 'var(--color-surface-secondary)',
                      color: current
                        ? 'var(--color-primary-800)'
                        : done
                          ? 'var(--color-success-700, #047857)'
                          : 'var(--color-text-tertiary)',
                      border: `1px solid ${current ? 'var(--color-primary-300)' : 'transparent'}`,
                    }}
                  >
                    {done ? <CheckCircle2 size={14} /> : <BadgeCheck size={14} />}
                    {MASTER_LABEL[s]}
                  </span>
                  {i < MASTER_ORDER.length - 1 && (
                    <ArrowRight size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ---- Breakdown chips ---- */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          <BreakdownChip label="Cotisation" total={retenue.totalCotisation} icon={<HandCoins size={16} />} tone="info" />
          <BreakdownChip label="Prêt" total={retenue.totalPret} icon={<Banknote size={16} />} tone="warning" />
          <BreakdownChip label="Convention" total={retenue.totalConvention} icon={<Building2 size={16} />} tone="primary" />
        </section>

        {/* ---- Lignes table ---- */}
        <section
          style={{
            background: 'white',
            border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
          }}
        >
          <SectionTitle>
            <ListChecks size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Lignes ({retenue.lignes.length})
          </SectionTitle>
          {retenue.lignes.length === 0 ? (
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
              Aucune ligne pour ce mois.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 'var(--font-size-sm)',
                  minWidth: 720,
                }}
              >
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--color-text-tertiary)' }}>
                    <th style={th}>Type</th>
                    <th style={th}>Motif</th>
                    <th style={{ ...th, textAlign: 'right' }}>Montant</th>
                    <th style={th}>Statut</th>
                    <th style={th}>Modifier</th>
                  </tr>
                </thead>
                <tbody>
                  {retenue.lignes.map((l) => (
                    <LigneRow
                      key={l.id}
                      ligne={l}
                      saving={saving}
                      onChange={(next) => setLigneStatutMutation.mutateAsync({ ligneId: l.id, statut: next })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--color-danger-50, #fef2f2)',
              border: '1px solid var(--color-danger-200, #fecaca)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-danger-700, #b91c1c)',
              fontSize: 'var(--font-size-sm)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* ---- Adherent recent history ---- */}
        <section
          style={{
            background: 'white',
            border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
          }}
        >
          <SectionTitle>
            <ListChecks size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Historique récent — {retenue.adherentNom}
          </SectionTitle>
          {history.isLoading ? (
            <div className="skeleton" style={{ height: 60, borderRadius: 'var(--radius-md)' }} />
          ) : (history.data?.length ?? 0) === 0 ? (
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
              Aucun autre mois pour cet adhérent.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.data!.slice(0, 8).map((r) => {
                const isCurrent = r.id === retenue.id;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => !isCurrent && navigate(`/treasurer/retenues/${r.id}`)}
                      disabled={isCurrent}
                      style={{
                        width: '100%', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 12px',
                        background: isCurrent ? 'var(--color-primary-50)' : 'var(--color-surface-secondary)',
                        border: `1px solid ${isCurrent ? 'var(--color-primary-200)' : 'var(--color-border-light)'}`,
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                        cursor: isCurrent ? 'default' : 'pointer',
                      }}
                    >
                      <span style={{ minWidth: 130, color: 'var(--color-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatMonth(r.mois, r.annee)}
                      </span>
                      <span style={{ flex: 1, color: 'var(--color-text-primary)' }}>
                        Cot. {formatCurrency(r.totalCotisation)} · Prêt {formatCurrency(r.totalPret)} · Conv. {formatCurrency(r.totalConvention)}
                      </span>
                      <strong style={{ minWidth: 100, textAlign: 'right' }}>{formatCurrency(r.totalRetenu)}</strong>
                      <StatusBadge
                        status={r.statut}
                        tone={MASTER_TONE[r.statut]}
                        label={MASTER_LABEL[r.statut]}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 24, right: 24, padding: '10px 14px',
            background: 'var(--color-primary-700)', color: 'white',
            borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)',
            fontWeight: 600, boxShadow: 'var(--shadow-md)', zIndex: 1000,
            maxWidth: 360,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// ----- Sub-components -----

function LigneRow({
  ligne, onChange, saving,
}: {
  ligne: RetenueLigne;
  onChange: (next: RetenueLigneStatut) => Promise<unknown>;
  saving: boolean;
}) {
  const [pending, setPending] = useState(false);
  const handle = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as RetenueLigneStatut;
    if (next === ligne.statut) return;
    setPending(true);
    try { await onChange(next); }
    finally { setPending(false); }
  };
  return (
    <tr style={{ borderTop: '1px solid var(--color-border-light)' }}>
      <td style={td}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {TYPE_ICON[ligne.typeSource]}
          {TYPE_LABEL[ligne.typeSource]}
        </span>
      </td>
      <td style={td}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FileText size={12} style={{ color: 'var(--color-text-tertiary)' }} />
          {ligne.motif}
        </span>
      </td>
      <td style={{ ...td, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {formatCurrency(ligne.montant)}
      </td>
      <td style={td}>
        <StatusBadge
          status={ligne.statut}
          tone={LIGNE_TONE[ligne.statut]}
          label={LIGNE_LABEL[ligne.statut]}
        />
      </td>
      <td style={td}>
        <FormSelect
          label=""
          value={ligne.statut}
          onChange={handle}
          options={LIGNE_OPTIONS}
          disabled={saving || pending}
        />
      </td>
    </tr>
  );
}

function BreakdownChip({
  label, total, icon, tone,
}: {
  label: string;
  total: number;
  icon: React.ReactNode;
  tone: 'info' | 'warning' | 'primary';
}) {
  const bg = tone === 'info'
    ? 'var(--color-primary-50)'
    : tone === 'warning'
      ? '#fff7ed'
      : 'var(--color-surface-secondary)';
  const fg = tone === 'info'
    ? 'var(--color-primary-700)'
    : tone === 'warning'
      ? '#c2410c'
      : 'var(--color-text-primary)';
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        background: bg,
        border: '1px solid var(--color-border-light)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span
        style={{
          fontSize: 'var(--font-size-xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'var(--color-text-tertiary)',
          fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}
      >
        <span style={{ color: fg }}>{icon}</span>
        {label}
      </span>
      <strong style={{ fontSize: 22, color: fg, fontVariantNumeric: 'tabular-nums' }}>
        {formatCurrency(total)}
      </strong>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4
      style={{
        margin: '0 0 12px',
        fontSize: 'var(--font-size-xs)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: 'var(--color-text-tertiary)',
        fontWeight: 600,
      }}
    >
      {children}
    </h4>
  );
}

function DetailField({
  icon, label, value,
}: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 'var(--font-size-xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'var(--color-text-tertiary)',
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {icon}
        {label}
      </span>
      <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>
        {value}
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 'var(--font-size-xs)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  fontWeight: 600,
};

const td: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
};
