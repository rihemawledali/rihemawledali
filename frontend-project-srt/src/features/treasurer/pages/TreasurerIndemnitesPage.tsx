/* ============================================
   Treasurer — Indemnités
   Implements the spec workflow:
     en_attente → validee/approuvee → payee
                                    → annulee
     en_attente → rejetee
   The "Payer" action redirects to the Paiements page with the
   indemnity prefilled.
   ============================================ */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check, X, Eye, HeartHandshake, Clock, CheckCircle2, Wallet, Tag, CreditCard, Ban,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusBadge } from '../../../components/data/StatusBadge';
import { StatCard } from '../../../components/charts/StatCard';
import { Button } from '../../../components/ui/Button';
import { SearchInput } from '../../../components/data/SearchInput';
import { FilterBar, SelectFilter } from '../../../components/data/FilterBar';
import { Pagination } from '../../../components/data/Pagination';
import { ConfirmDialog } from '../../../components/data/ConfirmDialog';
import { useToast } from '../../../components/feedback/useToast';
import { formatCurrency, formatDate, formatNumber } from '../../../lib/formatters';
import { treasurerIndemnitesApi } from '../api/treasurerListApi';
import { RequestDetailModal } from '../components/RequestDetailModal';
import type { Indemnite, IndemniteType, IndemniteStatus } from '../../../types/domain';
import '../../../components/layout/CrudPage.css';
import '../../dashboard/pages/OverviewPage.css';

const TYPE_LABEL: Record<IndemniteType, string> = {
  maladie: 'Maladie',
  naissance: 'Naissance',
  mariage: 'Mariage',
  deces: 'Décès',
  scolarite: 'Scolarité',
};

const TYPE_TONE: Record<IndemniteType, 'primary' | 'success' | 'info' | 'warning' | 'error'> = {
  maladie: 'error',
  naissance: 'success',
  mariage: 'primary',
  deces: 'warning',
  scolarite: 'info',
};

const STATUT_LABEL: Record<IndemniteStatus, string> = {
  en_attente: 'En attente',
  approuvee: 'Validée',
  validee: 'Validée',
  rejetee: 'Rejetée',
  payee: 'Payée',
  annulee: 'Annulée',
};

const STATUT_TONE: Record<IndemniteStatus, 'success' | 'warning' | 'info' | 'error' | 'neutral'> = {
  en_attente: 'warning',
  approuvee: 'info',
  validee: 'info',
  rejetee: 'error',
  payee: 'success',
  annulee: 'neutral',
};

function isValidated(s: IndemniteStatus) {
  return s === 'approuvee' || s === 'validee';
}

export function TreasurerIndemnitesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [typeF, setTypeF] = useState('');
  const [selected, setSelected] = useState<Indemnite | null>(null);
  const [rejecting, setRejecting] = useState<Indemnite | null>(null);
  const [cancelling, setCancelling] = useState<Indemnite | null>(null);

  const all = useQuery({
    queryKey: ['treasurer', 'indemnites', 'all'],
    queryFn: () => treasurerIndemnitesApi.list({ page: 1, size: 1000 }),
  });

  const query = useQuery({
    queryKey: ['treasurer', 'indemnites', { page, search, statut, typeF }],
    queryFn: () =>
      treasurerIndemnitesApi.list({
        page, size: 10, search,
        filters: { statut, type: typeF },
      }),
  });

  const valider = useMutation({
    mutationFn: (id: string) => treasurerIndemnitesApi.valider(id),
    onSuccess: (i) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'indemnites'] });
      toast.push({ title: `Indemnité ${i.id.toUpperCase()} validée`, variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const rejeter = useMutation({
    mutationFn: (id: string) => treasurerIndemnitesApi.rejeter(id),
    onSuccess: (i) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'indemnites'] });
      setRejecting(null);
      toast.push({ title: `Indemnité ${i.id.toUpperCase()} rejetée`, variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const annuler = useMutation({
    mutationFn: (id: string) => treasurerIndemnitesApi.annuler(id),
    onSuccess: (i) => {
      qc.invalidateQueries({ queryKey: ['treasurer', 'indemnites'] });
      setCancelling(null);
      toast.push({ title: `Indemnité ${i.id.toUpperCase()} annulée`, variant: 'success' });
    },
    onError: (e) => toast.push({ title: e instanceof Error ? e.message : 'Erreur', variant: 'error' }),
  });

  const handlePay = (i: Indemnite) => navigate(`/treasurer/paiements?indemniteId=${i.id}`);

  const stats = useMemo(() => {
    const items = all.data?.items ?? [];
    return {
      total: items.length,
      enAttente: items.filter((i) => i.statut === 'en_attente').length,
      validees: items.filter((i) => isValidated(i.statut)).length,
      payees: items.filter((i) => i.statut === 'payee').length,
      totalApayer: items.filter((i) => isValidated(i.statut)).reduce((s, i) => s + i.montant, 0),
    };
  }, [all.data]);

  const columns: Column<Indemnite>[] = useMemo(() => [
    { key: 'id', header: 'Référence', cell: (i) => <span className="cell-mono">{i.id.toUpperCase()}</span>, width: '140px' },
    { key: 'adherent', header: 'Adhérent', cell: (i) => <strong className="cell-strong">{i.adherentNom}</strong> },
    {
      key: 'type', header: 'Type indemnité', width: '160px',
      cell: (i) => <StatusBadge status={i.type} tone={TYPE_TONE[i.type]} label={TYPE_LABEL[i.type]} />,
    },
    {
      key: 'montant', header: 'Montant', align: 'right', width: '140px',
      cell: (i) => <strong className="amount">{formatCurrency(i.montant)}</strong>,
    },
    { key: 'date', header: 'Date demande', cell: (i) => formatDate(i.dateDemande), width: '140px' },
    {
      key: 'statut', header: 'Statut', width: '130px',
      cell: (i) => <StatusBadge status={i.statut} tone={STATUT_TONE[i.statut]} label={STATUT_LABEL[i.statut]} />,
    },
  ], []);

  return (
    <div className="overview-page">
      <PageHeader
        title="Indemnités"
        description="Valider, rejeter, payer ou annuler les demandes d’indemnités"
        breadcrumb={['Trésorerie', 'Demandes', 'Indemnités']}
      />

      <div className="overview-stats">
        <StatCard label="Total demandes" value={formatNumber(stats.total)} icon={<HeartHandshake size={22} />} tone="primary" loading={all.isLoading} />
        <StatCard label="En attente" value={formatNumber(stats.enAttente)} icon={<Clock size={22} />} tone="warning" loading={all.isLoading} />
        <StatCard label="Validées" value={formatNumber(stats.validees)} icon={<CheckCircle2 size={22} />} tone="info" loading={all.isLoading} />
        <StatCard label="Payées" value={formatNumber(stats.payees)} icon={<CheckCircle2 size={22} />} tone="success" loading={all.isLoading} />
        <StatCard label="Montant à payer" value={formatCurrency(stats.totalApayer)} icon={<Wallet size={22} />} tone="success" loading={all.isLoading} />
      </div>

      <div className="crud-toolbar">
        <FilterBar>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Adhérent, type, motif…" />
          <SelectFilter label="Type" value={typeF} onChange={(v) => { setTypeF(v); setPage(1); }}
            options={Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
          <SelectFilter label="Statut" value={statut} onChange={(v) => { setStatut(v); setPage(1); }}
            options={[
              { value: 'en_attente', label: 'En attente' },
              { value: 'approuvee', label: 'Validée' },
              { value: 'rejetee', label: 'Rejetée' },
              { value: 'payee', label: 'Payée' },
              { value: 'annulee', label: 'Annulée' },
            ]} />
        </FilterBar>
      </div>

      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        rowKey={(i) => i.id}
        emptyTitle="Aucune indemnité"
        rowActions={(i) => (
          <span className="row-actions" style={{ display: 'inline-flex', gap: 6 }}>
            <Button variant="ghost" size="sm" onClick={() => setSelected(i)} title="Voir"><Eye size={14} /></Button>
            {i.statut === 'en_attente' && (
              <>
                <Button variant="primary" size="sm" onClick={() => valider.mutate(i.id)} disabled={valider.isPending} title="Valider"><Check size={14} /></Button>
                <Button variant="danger" size="sm" onClick={() => setRejecting(i)} title="Rejeter"><X size={14} /></Button>
              </>
            )}
            {isValidated(i.statut) && (
              <>
                <Button variant="primary" size="sm" onClick={() => handlePay(i)} title="Payer"><CreditCard size={14} /></Button>
                <Button variant="ghost" size="sm" onClick={() => setCancelling(i)} title="Annuler"><Ban size={14} /></Button>
              </>
            )}
          </span>
        )}
      />

      {query.data && query.data.total > 0 && (
        <div className="data-table-card" style={{ marginTop: 'var(--space-3)' }}>
          <Pagination page={page} size={10} total={query.data.total} onPageChange={setPage} />
        </div>
      )}

      <RequestDetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Détails de l’indemnité"
        reference={selected?.id ?? ''}
        adherentNom={selected?.adherentNom ?? ''}
        dateDemande={selected?.dateDemande ?? ''}
        statut={selected?.statut ?? ''}
        motif={selected?.motif}
        documentNom={selected?.documentNom}
        documentSize={selected?.documentSize}
        canDecide={selected?.statut === 'en_attente'}
        onValidate={() => { if (selected) { valider.mutate(selected.id); setSelected(null); } }}
        onReject={() => { if (selected) { setRejecting(selected); setSelected(null); } }}
        fields={selected ? [
          { label: 'Type', icon: <Tag size={14} />, value: <StatusBadge status={selected.type} tone={TYPE_TONE[selected.type]} label={TYPE_LABEL[selected.type]} /> },
          { label: 'Montant', icon: <Wallet size={14} />, value: <strong>{formatCurrency(selected.montant)}</strong> },
          { label: 'Statut', icon: <CheckCircle2 size={14} />, value: <StatusBadge status={selected.statut} tone={STATUT_TONE[selected.statut]} label={STATUT_LABEL[selected.statut]} /> },
        ] : []}
      />

      <ConfirmDialog
        open={!!rejecting}
        title="Rejeter cette indemnité ?"
        message={`La demande de ${rejecting?.adherentNom} (${formatCurrency(rejecting?.montant ?? 0)}) sera marquée comme rejetée.`}
        confirmLabel="Rejeter" destructive loading={rejeter.isPending}
        onCancel={() => setRejecting(null)} onConfirm={() => rejecting && rejeter.mutate(rejecting.id)}
      />
      <ConfirmDialog
        open={!!cancelling}
        title="Annuler cette indemnité ?"
        message={`La demande de ${cancelling?.adherentNom} sera marquée comme annulée. Cette action n'a pas d'impact sur la trésorerie.`}
        confirmLabel="Annuler l'indemnité" destructive loading={annuler.isPending}
        onCancel={() => setCancelling(null)} onConfirm={() => cancelling && annuler.mutate(cancelling.id)}
      />
    </div>
  );
}
