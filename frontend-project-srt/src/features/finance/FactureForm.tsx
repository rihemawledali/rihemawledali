import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { factureSchema, type FactureFormValues } from '../../lib/validators';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { Button } from '../../components/ui/Button';
import { suppliersApi } from '../suppliers/suppliersApi';
import type { Facture } from '../../types/domain';

interface Props {
  initial?: Facture;
  onSubmit: (v: FactureFormValues) => Promise<unknown> | void;
  onCancel: () => void;
  submitting?: boolean;
}

export function FactureForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const suppliers = useQuery({ queryKey: ['suppliers', 'all-options'], queryFn: () => suppliersApi.list({ page: 1, size: 200 }) });
  const { register, handleSubmit, formState: { errors } } = useForm<FactureFormValues>({
    resolver: zodResolver(factureSchema),
    defaultValues: initial
      ? { numero: initial.numero, fournisseurId: initial.fournisseurId, montant: initial.montant, statut: initial.statut, dateEmission: initial.dateEmission.slice(0, 10), dateEcheance: initial.dateEcheance.slice(0, 10) }
      : { numero: `FAC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`, fournisseurId: '', montant: 0, statut: 'impayee', dateEmission: new Date().toISOString().slice(0, 10), dateEcheance: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) },
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
        { value: 'payee', label: 'Payée' }, { value: 'impayee', label: 'Impayée' },
        { value: 'partielle', label: 'Partielle' }, { value: 'en_retard', label: 'En retard' },
      ]} error={errors.statut?.message} />
      <FormInput label="Date d'émission" type="date" {...register('dateEmission')} error={errors.dateEmission?.message} />
      <FormInput label="Date d'échéance" type="date" {...register('dateEcheance')} error={errors.dateEcheance?.message} />
      <div className="form-grid-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="submit" isLoading={submitting}>{initial ? 'Mettre à jour' : 'Créer'}</Button>
      </div>
    </form>
  );
}
