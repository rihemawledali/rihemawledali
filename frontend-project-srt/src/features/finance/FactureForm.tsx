import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { factureSchema, type FactureFormValues } from '../../shared/validators';
import { FormInput } from '../../shared/ui/FormInput';
import { FormSelect } from '../../shared/ui/FormSelect';
import { Button } from '../../shared/ui/Button';
import { suppliersApi } from '../admin/suppliers/suppliersApi';
import type { Facture } from '../../shared/types/domain';

interface Props {
  initial?: Facture;
  onSubmit: (v: FactureFormValues) => Promise<unknown> | void;
  onCancel: () => void;
  submitting?: boolean;
}

function createFactureDefaults(initial?: Facture): FactureFormValues {
  if (initial) {
    return {
      numero: initial.numero,
      fournisseurId: initial.fournisseurId,
      montant: initial.montant,
      statut: initial.statut,
      dateEmission: initial.dateEmission.slice(0, 10),
      dateEcheance: initial.dateEcheance.slice(0, 10),
      description: initial.description ?? '',
    };
  }

  const now = new Date();
  const due = new Date(now.getTime() + 30 * 86400000);
  return {
    numero: `FAC-${now.getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    fournisseurId: '',
    montant: 0,
    statut: 'non_payee',
    dateEmission: now.toISOString().slice(0, 10),
    dateEcheance: due.toISOString().slice(0, 10),
    description: '',
  };
}

export function FactureForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const suppliers = useQuery({ queryKey: ['suppliers', 'all-options'], queryFn: () => suppliersApi.list({ page: 1, size: 200 }) });
  const [defaultValues] = useState(() => createFactureDefaults(initial));
  const { register, handleSubmit, formState: { errors } } = useForm<FactureFormValues>({
    resolver: zodResolver(factureSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
      <FormInput label="Numéro" {...register('numero')} error={errors.numero?.message} />
      <FormSelect
        label="Fournisseur"
        {...register('fournisseurId')}
        options={(suppliers.data?.items ?? []).map((s) => ({ value: s.id, label: s.nom }))}
        placeholder="Sélectionnez un fournisseur"
        error={errors.fournisseurId?.message}
      />
      <FormInput label="Montant (TND)" type="number" step="0.01" {...register('montant', { valueAsNumber: true })} error={errors.montant?.message} />
      <FormSelect label="Statut" {...register('statut')} options={[
        { value: 'brouillon', label: 'Brouillon' },
        { value: 'non_payee', label: 'Non payée' },
        { value: 'partielle', label: 'Partielle' },
        { value: 'en_retard', label: 'En retard' },
        { value: 'payee', label: 'Payée' },
        { value: 'annulee', label: 'Annulée' },
      ]} error={errors.statut?.message} />
      <FormInput label="Date d'émission" type="date" {...register('dateEmission')} error={errors.dateEmission?.message} />
      <FormInput label="Date d'échéance" type="date" {...register('dateEcheance')} error={errors.dateEcheance?.message} />
      <div className="form-grid-full">
        <FormInput label="Description (optionnel)" {...register('description')} error={errors.description?.message} />
      </div>
      <div className="form-grid-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="submit" isLoading={submitting}>{initial ? 'Mettre à jour' : 'Créer'}</Button>
      </div>
    </form>
  );
}
