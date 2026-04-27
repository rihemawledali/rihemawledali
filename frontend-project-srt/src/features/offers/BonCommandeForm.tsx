import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { bonCommandeSchema, type BonCommandeFormValues } from '../../lib/validators';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { Button } from '../../components/ui/Button';
import { suppliersApi } from '../suppliers/suppliersApi';
import { usersApi } from '../users/usersApi';
import type { BonCommande } from '../../types/domain';

interface Props {
  initial?: BonCommande;
  onSubmit: (v: BonCommandeFormValues) => Promise<unknown> | void;
  onCancel: () => void;
  submitting?: boolean;
}

export function BonCommandeForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const suppliers = useQuery({ queryKey: ['suppliers', 'all-options'], queryFn: () => suppliersApi.list({ page: 1, size: 200 }) });
  const adherents = useQuery({
    queryKey: ['users', 'adherent-options'],
    queryFn: () => usersApi.list({ page: 1, size: 200, filters: { role: 'adherent' } }),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<BonCommandeFormValues>({
    resolver: zodResolver(bonCommandeSchema),
    defaultValues: initial
      ? { numero: initial.numero, fournisseurId: initial.fournisseurId, adherentId: initial.adherentId ?? '', montant: initial.montant, statut: initial.statut, dateEmission: initial.dateEmission.slice(0, 10), dateExpiration: initial.dateExpiration.slice(0, 10) }
      : { numero: `BC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`, fournisseurId: '', adherentId: '', montant: 100, statut: 'en_attente', dateEmission: new Date().toISOString().slice(0, 10), dateExpiration: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10) },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
      <FormInput label="Numéro" {...register('numero')} error={errors.numero?.message} />
      <FormInput label="Montant (TND)" type="number" step="0.01" {...register('montant', { valueAsNumber: true })} error={errors.montant?.message} />
      <FormSelect
        label="Fournisseur"
        {...register('fournisseurId')}
        options={(suppliers.data?.items ?? []).map((s) => ({ value: s.id, label: s.nom }))}
        placeholder="Sélectionnez un fournisseur"
        error={errors.fournisseurId?.message}
      />
      <FormSelect
        label="Adhérent (optionnel)"
        {...register('adherentId')}
        options={(adherents.data?.items ?? []).map((a) => ({ value: a.id, label: `${a.prenom} ${a.nom}` }))}
        placeholder="Non attribué"
        error={errors.adherentId?.message}
      />
      <FormSelect label="Statut" {...register('statut')} options={[
        { value: 'en_attente', label: 'En attente' }, { value: 'attribue', label: 'Attribué' },
        { value: 'utilise', label: 'Utilisé' }, { value: 'expire', label: 'Expiré' },
      ]} error={errors.statut?.message} />
      <FormInput label="Date d'émission" type="date" {...register('dateEmission')} error={errors.dateEmission?.message} />
      <FormInput label="Date d'expiration" type="date" {...register('dateExpiration')} error={errors.dateExpiration?.message} />
      <div className="form-grid-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="submit" isLoading={submitting}>{initial ? 'Mettre à jour' : 'Créer'}</Button>
      </div>
    </form>
  );
}
