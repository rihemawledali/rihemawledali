import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { ticketSchema, type TicketFormValues } from '../../../shared/validators';
import { FormInput } from '../../../shared/ui/FormInput';
import { FormSelect } from '../../../shared/ui/FormSelect';
import { Button } from '../../../shared/ui/Button';
import { usersApi } from '../users/usersApi';
import type { BonStatus, TicketRestaurant } from '../../../shared/types/domain';

interface Props {
  initial?: TicketRestaurant;
  onSubmit: (v: TicketFormValues) => Promise<unknown> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const TICKET_STATUSES = ['en_attente', 'attribue', 'utilise', 'expire'] as const;

function toTicketStatus(status: BonStatus | undefined): TicketFormValues['statut'] {
  return TICKET_STATUSES.includes(status as TicketFormValues['statut'])
    ? (status as TicketFormValues['statut'])
    : 'en_attente';
}

export function TicketForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const [defaults] = useState(() => {
    const today = new Date();
    return {
      numero: `TR-${today.getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      dateEmission: today.toISOString().slice(0, 10),
    };
  });

  const adherents = useQuery({
    queryKey: ['users', 'adherent-options'],
    queryFn: () => usersApi.list({ page: 1, size: 500, filters: { role: 'adherent' } }),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: initial
      ? { numero: initial.numero, typeBon: initial.typeBon, montant: initial.montant, statut: toTicketStatus(initial.statut), adherentId: initial.adherentId ?? '', dateEmission: initial.dateEmission.slice(0, 10) }
      : { numero: defaults.numero, typeBon: 'restaurant', montant: 8, statut: 'en_attente', adherentId: '', dateEmission: defaults.dateEmission },
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values))} className="form-grid">
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
