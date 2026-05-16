/* ============================================
   Form: Pay a fournisseur facture
   Used from FacturesPage and PaiementsPage (when ?factureId=… is set).
   ============================================ */

import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { FormInput } from '../../../shared/ui/FormInput';
import { FormSelect } from '../../../shared/ui/FormSelect';
import { Button } from '../../../shared/ui/Button';
import { formatCurrency } from '../../../shared/lib/formatters';
import { treasurerTresorerieApi } from '../api/treasurerListApi';
import type { Facture, PaiementMode, CompteBancaire } from '../../../shared/types/domain';

interface FormValues {
  reference: string;
  montant: number;
  mode: PaiementMode;
  description?: string;
  compteBancaireId: string;
}

interface Props {
  facture: Facture;
  onSubmit: (v: FormValues) => Promise<unknown> | void;
  onCancel: () => void;
  submitting?: boolean;
}

function createPaymentReference() {
  return `PAY-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
}

export function PayFactureForm({ facture, onSubmit, onCancel, submitting }: Props) {
  const [reference] = useState(createPaymentReference);
  const [comptes, setComptes] = useState<CompteBancaire[]>([]);
  const [comptesLoading, setComptesLoading] = useState(true);

  useEffect(() => {
    treasurerTresorerieApi.listComptes()
      .then(setComptes)
      .finally(() => setComptesLoading(false));
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      reference,
      montant: facture.montant,
      mode: 'virement',
      description: `Paiement facture fournisseur ${facture.numero}`,
      compteBancaireId: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
      <FormSelect
        label="Compte bancaire"
        {...register('compteBancaireId', { required: 'Compte bancaire requis' })}
        options={comptesLoading ? [{ value: '', label: 'Chargement...' }] : [
          { value: '', label: 'Sélectionner un compte' },
          ...comptes.map((c) => ({ value: c.id, label: `${c.banque} — ${c.iban} (${c.solde.toFixed(2)} ${c.devise})` })),
        ]}
        error={errors.compteBancaireId?.message}
      />
      {/* Read-only context */}
      <div
        className="form-grid-full"
        style={{
          padding: 'var(--space-3)',
          background: 'var(--color-surface-secondary)',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-md)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <ReadField label="Facture" value={facture.numero} mono />
        <ReadField label="Fournisseur" value={facture.fournisseurNom} />
        <ReadField label="Montant" value={formatCurrency(facture.montant)} highlight />
        <ReadField label="Statut" value={facture.statut.replace('_', ' ')} />
      </div>

      <FormInput label="Référence paiement" {...register('reference', { required: 'Référence requise' })} error={errors.reference?.message} />
      <FormInput
        label="Montant (TND)"
        type="number" step="0.01"
        {...register('montant', { valueAsNumber: true, required: 'Montant requis', min: { value: 0.01, message: 'Montant > 0' } })}
        error={errors.montant?.message}
      />
      <FormSelect
        label="Mode de paiement"
        {...register('mode', { required: true })}
        options={[
          { value: 'virement', label: 'Virement' },
          { value: 'cheque', label: 'Chèque' },
          { value: 'especes', label: 'Espèces' },
          { value: 'carte', label: 'Carte bancaire' },
        ]}
      />
      <div className="form-grid-full">
        <FormInput label="Description (optionnel)" {...register('description')} />
      </div>

      <div className="form-grid-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting || comptesLoading}>Annuler</Button>
        <Button type="submit" isLoading={submitting || comptesLoading} disabled={comptes.length === 0}>Payer la facture</Button>
      </div>
    </form>
  );
}

function ReadField({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div>
      <span
        style={{
          fontSize: 'var(--font-size-xs)', textTransform: 'uppercase',
          letterSpacing: '0.04em', color: 'var(--color-text-tertiary)',
          fontWeight: 600, display: 'block', marginBottom: 4,
        }}
      >{label}</span>
      <strong
        style={{
          fontSize: highlight ? 16 : 14,
          fontFamily: mono ? 'var(--font-family-mono, monospace)' : undefined,
          color: highlight ? 'var(--color-success-700)' : 'var(--color-text-primary)',
        }}
      >
        {value}
      </strong>
    </div>
  );
}
