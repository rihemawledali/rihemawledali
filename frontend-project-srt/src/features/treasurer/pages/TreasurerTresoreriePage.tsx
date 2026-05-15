/* ============================================
   Treasurer — Trésorerie (état des comptes)
   ============================================ */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Building2, Plus, Pencil, Trash2, PiggyBank } from 'lucide-react';
import { PageHeader } from '../../../shared/layout/PageHeader';
import { StatCard } from '../../../shared/charts/StatCard';
import { ChartCard } from '../../../shared/charts/ChartCard';
import { DataTable, type Column } from '../../../shared/data/DataTable';
import { Modal } from '../../../shared/data/Modal';
import { ConfirmDialog } from '../../../shared/data/ConfirmDialog';
import { Button } from '../../../shared/ui/Button';
import { useToast } from '../../../shared/feedback/useToast';
import { formatCurrency, formatDate } from '../../../shared/lib/formatters';
import { treasurerTresorerieApi } from '../tresorerie/api';
import { treasurerApi } from '../api/treasurerApi';
import { CompteBancaireForm } from '../forms/CompteBancaireForm';
import { DepotManuelForm } from '../forms/DepotManuelForm';
import type { CompteBancaire } from '../../../shared/types/domain';
import type { CompteBancaireFormValues } from '../../../shared/validators';
import type { DepotFormValues } from '../forms/DepotManuelForm';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import './TreasurerTresoreriePage.css';

export function TreasurerTresoreriePage() {
  const qc = useQueryClient();
  const toast = useToast();
  const snap = useQuery({ queryKey: ['treasurer', 'tresorerie'], queryFn: treasurerTresorerieApi.snapshot });
  const cashflow = useQuery({ queryKey: ['treasurer', 'cashflow'], queryFn: treasurerApi.getCashflow });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CompteBancaire | null>(null);
  const [deleting, setDeleting] = useState<CompteBancaire | null>(null);
  const [depositing, setDepositing] = useState<CompteBancaire | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['treasurer', 'tresorerie'] });
    qc.invalidateQueries({ queryKey: ['treasurer', 'stats'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  /** Map a REST error body to a human-readable toast message. */
  const toastError = (fallback: string) => (err: unknown) => {
    const msg = extractErrorMessage(err) ?? fallback;
    toast.push({ title: msg, variant: 'error' });
  };

  const createMut = useMutation({
    mutationFn: (v: CompteBancaireFormValues) => treasurerTresorerieApi.createCompte(v),
    onSuccess: () => {
      setCreating(false);
      invalidate();
      toast.push({ title: 'Compte bancaire créé', variant: 'success' });
    },
    onError: toastError('Création impossible.'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, v }: { id: string; v: CompteBancaireFormValues }) =>
      treasurerTresorerieApi.updateCompte(id, v),
    onSuccess: () => {
      setEditing(null);
      invalidate();
      toast.push({ title: 'Compte mis à jour', variant: 'success' });
    },
    onError: toastError('Mise à jour impossible.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => treasurerTresorerieApi.deleteCompte(id),
    onSuccess: () => {
      setDeleting(null);
      invalidate();
      toast.push({ title: 'Compte supprimé', variant: 'success' });
    },
    onError: toastError('Suppression impossible.'),
  });

  const depositMut = useMutation({
    mutationFn: ({ id, v }: { id: string; v: DepotFormValues }) =>
      treasurerTresorerieApi.deposerManuellement(id, { montant: v.montant, description: v.description }),
    onSuccess: () => {
      setDepositing(null);
      invalidate();
      qc.invalidateQueries({ queryKey: ['historique'] });
      toast.push({ title: 'Versement enregistré', variant: 'success' });
    },
    onError: toastError('Versement impossible.'),
  });

  const compteColumns: Column<CompteBancaire>[] = [
    {
      key: 'banque',
      header: 'Banque',
      cell: (c) => <strong>{c.banque}</strong>,
    },
    {
      key: 'iban',
      header: 'IBAN',
      cell: (c) => <span style={{ fontFamily: 'var(--font-family-mono, monospace)' }}>{c.iban}</span>,
    },
    {
      key: 'devise',
      header: 'Devise',
      cell: (c) => c.devise,
      width: '80px',
    },
    {
      key: 'solde',
      header: 'Solde',
      cell: (c) => (
        <strong style={{ color: c.solde >= 0 ? 'var(--color-success-700)' : 'var(--color-error-700)' }}>
          {formatCurrency(c.solde)}
        </strong>
      ),
      align: 'right',
      width: '160px',
    },
  ];

  return (
    <div className="treasurer-tresorerie-page">
      <PageHeader
        title="Trésorerie"
        description="État de la trésorerie en temps réel"
        breadcrumb={['Trésorerie', 'Finance', 'Trésorerie']}
        actions={(
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} /> Nouveau compte
          </Button>
        )}
      />

      <div className="treasurer-tresorerie-stats">
        <StatCard
          label="Solde global"
          value={snap.data ? formatCurrency(snap.data.totalSolde) : '—'}
          icon={<Wallet size={22} />}
          tone="success"
          loading={snap.isLoading}
        />
        <StatCard
          label="Encaissements du mois"
          value={snap.data ? formatCurrency(snap.data.encaissementsMois) : '—'}
          icon={<ArrowDownToLine size={22} />}
          tone="success"
          loading={snap.isLoading}
        />
        <StatCard
          label="Décaissements du mois"
          value={snap.data ? formatCurrency(snap.data.decaissementsMois) : '—'}
          icon={<ArrowUpFromLine size={22} />}
          tone="error"
          loading={snap.isLoading}
        />
        <StatCard
          label="Comptes bancaires"
          value={snap.data?.comptes.length ?? '—'}
          icon={<Building2 size={22} />}
          tone="primary"
          loading={snap.isLoading}
        />
      </div>

      <ChartCard
        title="Mouvements mensuels"
        subtitle="Entrées vs sorties sur les 12 derniers mois"
        height={280}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={cashflow.data ?? []} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="mois" stroke="var(--color-text-tertiary)" fontSize={12} />
            <YAxis
              stroke="var(--color-text-tertiary)"
              fontSize={12}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              formatter={(v) => formatCurrency(Number(v ?? 0))}
              contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="entrees" name="Entrées" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="sorties" name="Sorties" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <header>
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            Comptes bancaires
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
            {snap.data?.derniereOperation
              ? `Dernière opération : ${formatDate(snap.data.derniereOperation)}`
              : 'Aucune opération récente'}
          </p>
        </header>
        <DataTable
          columns={compteColumns}
          rows={snap.data?.comptes ?? []}
          loading={snap.isLoading}
          rowKey={(c) => c.id}
          emptyTitle="Aucun compte enregistré"
          emptyDescription="Créez un compte bancaire pour alimenter la trésorerie."
          rowActions={(c) => (
            <div style={{ display: 'inline-flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="primary" size="sm" onClick={() => setDepositing(c)} aria-label="Déposer" title="Déposer de l'argent">
                <PiggyBank size={14} />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setEditing(c)} aria-label="Modifier">
                <Pencil size={14} />
              </Button>
              <Button variant="danger" size="sm" onClick={() => setDeleting(c)} aria-label="Supprimer">
                <Trash2 size={14} />
              </Button>
            </div>
          )}
          actionsWidth="150px"
        />
      </section>

      {/* Create */}
      <Modal open={creating} onClose={() => setCreating(false)} title="Nouveau compte bancaire">
        <CompteBancaireForm
          onSubmit={(v) => createMut.mutateAsync(v)}
          onCancel={() => setCreating(false)}
          submitting={createMut.isPending}
        />
      </Modal>

      {/* Edit */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier le compte bancaire">
        {editing && (
          <CompteBancaireForm
            initial={editing}
            onSubmit={(v) => updateMut.mutateAsync({ id: editing.id, v })}
            onCancel={() => setEditing(null)}
            submitting={updateMut.isPending}
          />
        )}
      </Modal>

      {/* Deposit */}
      <Modal open={!!depositing} onClose={() => setDepositing(null)} title="Déposer de l'argent">
        {depositing && (
          <DepotManuelForm
            compte={depositing}
            onSubmit={(v) => depositMut.mutateAsync({ id: depositing.id, v })}
            onCancel={() => setDepositing(null)}
            submitting={depositMut.isPending}
          />
        )}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleting}
        title="Supprimer ce compte ?"
        message={
          deleting
            ? `Confirmer la suppression de « ${deleting.banque} — ${deleting.iban} » ? Cette action est irréversible.`
            : ''
        }
        confirmLabel="Supprimer"
        destructive
        loading={deleteMut.isPending}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

/**
 * Extract a human-readable message from an apiClient error.
 * apiClient throws `ApiError extends Error` where `.message` is already
 * the backend's `error` field (see `lib/apiClient.ts`).
 */
function extractErrorMessage(err: unknown): string | null {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  return null;
}
