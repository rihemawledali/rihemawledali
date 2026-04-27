import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paiementSchema, type PaiementFormValues } from '../../lib/validators';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { Button } from '../../components/ui/Button';
import type { Paiement } from '../../types/domain';

interface Props {
  initial?: Paiement;
  onSubmit: (v: PaiementFormValues) => Promise<unknown> | void;
  onCancel: () => void;
  submitting?: boolean;
}

export function PaiementForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<PaiementFormValues>({
    resolver: zodResolver(paiementSchema),
    defaultValues: initial
      ? { reference: initial.reference, beneficiaire: initial.beneficiaire, montant: initial.montant, mode: initial.mode, statut: initial.statut, factureNumero: initial.factureNumero ?? '' }
      : { reference: `PAY-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`, beneficiaire: '', montant: 0, mode: 'virement', statut: 'en_attente', factureNumero: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
      <FormInput label="Référence" {...register('reference')} error={errors.reference?.message} />
      <FormInput label="Bénéficiaire" {...register('beneficiaire')} error={errors.beneficiaire?.message} />
      <FormInput label="Montant (TND)" type="number" step="0.01" {...register('montant', { valueAsNumber: true })} error={errors.montant?.message} />
      <FormSelect label="Mode" {...register('mode')} options={[
        { value: 'virement', label: 'Virement' },
        { value: 'cheque', label: 'Chèque' },
        { value: 'especes', label: 'Espèces' },
        { value: 'carte', label: 'Carte bancaire' },
      ]} error={errors.mode?.message} />
      <FormSelect label="Statut" {...register('statut')} options={[
        { value: 'reussi', label: 'Réussi' },
        { value: 'en_attente', label: 'En attente' },
        { value: 'echoue', label: 'Échoué' },
        { value: 'rembourse', label: 'Remboursé' },
      ]} error={errors.statut?.message} />
      <FormInput label="N° facture (optionnel)" {...register('factureNumero')} error={errors.factureNumero?.message} />
      <div className="form-grid-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="submit" isLoading={submitting}>{initial ? 'Mettre à jour' : 'Créer'}</Button>
      </div>
    </form>
  );
}
