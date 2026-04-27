import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { ticketSchema, type TicketFormValues } from '../../lib/validators';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { Button } from '../../components/ui/Button';
import { usersApi } from '../users/usersApi';
import type { TicketRestaurant } from '../../types/domain';

interface Props {
  initial?: TicketRestaurant;
  onSubmit: (v: TicketFormValues) => Promise<unknown> | void;
  onCancel: () => void;
  submitting?: boolean;
}

export function TicketForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const adherents = useQuery({
    queryKey: ['users', 'adherent-options'],
    queryFn: () => usersApi.list({ page: 1, size: 500, filters: { role: 'adherent' } }),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: initial
      ? { numero: initial.numero, typeBon: initial.typeBon, montant: initial.montant, statut: initial.statut, adherentId: initial.adherentId ?? '', dateEmission: initial.dateEmission.slice(0, 10) }
      : { numero: `TR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`, typeBon: 'restaurant', montant: 8, statut: 'en_attente', adherentId: '', dateEmission: new Date().toISOString().slice(0, 10) },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
      <FormInput label="Numéro" {...register('numero')} error={errors.numero?.message} />
      <FormSelect label="Type de bon" {...register('typeBon')} options={[
        { value: 'restaurant', label: 'Restaurant' }, { value: 'cafeteria', label: 'Cafétéria' },
      ]} error={errors.typeBon?.message} />
      <FormInput label="Montant (TND)" type="number" step="0.01" {...register('montant', { valueAsNumber: true })} error={errors.montant?.message} />
      <FormSelect label="Statut" {...register('statut')} options={[
        { value: 'en_attente', label: 'En attente' }, { value: 'attribue', label: 'Attribué' },
        { value: 'utilise', label: 'Utilisé' }, { value: 'expire', label: 'Expiré' },
      ]} error={errors.statut?.message} />
      <FormSelect
        label="Adhérent (optionnel)"
        {...register('adherentId')}
        options={(adherents.data?.items ?? []).map((a) => ({ value: a.id, label: `${a.prenom} ${a.nom}` }))}
        placeholder="Non attribué"
        error={errors.adherentId?.message}
      />
      <FormInput label="Date d'émission" type="date" {...register('dateEmission')} error={errors.dateEmission?.message} />
      <div className="form-grid-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Annuler</Button>
        <Button type="submit" isLoading={submitting}>{initial ? 'Mettre à jour' : 'Créer'}</Button>
      </div>
    </form>
  );
}
