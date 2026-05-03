/* ============================================
   Form: Pay a validated indemnité
   Used from TreasurerIndemnitesPage and PaiementsPage (?indemniteId=…).
   ============================================ */

import { useForm } from 'react-hook-form';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../lib/formatters';
import type { Indemnite, PaiementMode } from '../../types/domain';

const TYPE_LABEL: Record<Indemnite['type'], string> = {
  maladie: 'Maladie',
  naissance: 'Naissance',
  mariage: 'Mariage',
  deces: 'Décès',
  scolarite: 'Scolarité',
};

interface FormValues {
  reference: string;
  montant: number;
  mode: PaiementMode;
  description?: string;
}

interface Props {
  indemnite: Indemnite;
  onSubmit: (v: FormValues) => Promise<unknown> | void;
  onCancel: () => void;
  submitting?: boolean;
}

export function PayIndemniteForm({ indemnite, onSubmit, onCancel, submitting }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      reference: `PAY-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      montant: indemnite.montant,
      mode: 'virement',
      description: `Paiement indemnité ${indemnite.id.toUpperCase()} (${TYPE_LABEL[indemnite.type]})`,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
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
        <ReadField label="Référence" value={indemnite.id.toUpperCase()} mono />
        <ReadField label="Adhérent" value={indemnite.adherentNom} />
        <ReadField label="Type" value={TYPE_LABEL[indemnite.type]} />
        <ReadField label="Montant" value={formatCurrency(indemnite.montant)} highlight />
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
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="submit" isLoading={submitting}>Payer l’indemnité</Button>
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
