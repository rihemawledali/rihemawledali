import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { bonCommandeSchema, type BonCommandeFormValues } from '../../../shared/validators';
import { FormInput } from '../../../shared/ui/FormInput';
import { FormSelect } from '../../../shared/ui/FormSelect';
import { Button } from '../../../shared/ui/Button';
import { suppliersApi } from '../suppliers/suppliersApi';
import type { BonCommande, BonStatus, TicketType } from '../../../shared/types/domain';

interface Props {
  initial?: BonCommande;
  onSubmit: (v: BonCommandeFormValues) => Promise<unknown> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const STOCK_STATUSES = ['brouillon', 'valide', 'epuise', 'expire'] as const;

function toStockStatus(status: BonStatus | undefined): BonCommandeFormValues['statut'] {
  return STOCK_STATUSES.includes(status as BonCommandeFormValues['statut'])
    ? (status as BonCommandeFormValues['statut'])
    : 'brouillon';
}

function toTicketType(type: TicketType | undefined): BonCommandeFormValues['typeBon'] {
  return type === 'cafeteria' ? 'cafeteria' : 'restaurant';
}

export function BonCommandeForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const [defaults] = useState(() => {
    const today = new Date();
    const expiration = new Date(today.getTime() + 90 * 86400000);
    return {
      numero: `BC-${today.getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      dateEmission: today.toISOString().slice(0, 10),
      dateExpiration: expiration.toISOString().slice(0, 10),
    };
  });

  const initialValues = useMemo<BonCommandeFormValues>(() => initial
    ? {
        numero: initial.numero,
        fournisseurId: initial.fournisseurId,
        adherentId: initial.adherentId ?? '',
        typeBon: toTicketType(initial.typeBon),
        montant: initial.montant,
        valeurUnitaire: initial.valeurUnitaire ?? 10,
        quantiteTotale: initial.quantiteTotale
          ?? Math.max(1, Math.round(initial.montant / (initial.valeurUnitaire ?? 10))),
        statut: toStockStatus(initial.statut),
        dateEmission: initial.dateEmission.slice(0, 10),
        dateExpiration: initial.dateExpiration.slice(0, 10),
      }
    : {
        numero: defaults.numero,
        fournisseurId: '',
        adherentId: '',
        typeBon: 'restaurant',
        montant: 1000,
        valeurUnitaire: 10,
        quantiteTotale: 100,
        statut: 'brouillon',
        dateEmission: defaults.dateEmission,
        dateExpiration: defaults.dateExpiration,
      }, [defaults, initial]);

  const [unitValue, setUnitValue] = useState(initialValues.valeurUnitaire);
  const [quantityValue, setQuantityValue] = useState(initialValues.quantiteTotale);

  const suppliers = useQuery({
    queryKey: ['suppliers', 'all-options'],
    queryFn: () => suppliersApi.list({ page: 1, size: 200 }),
  });

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<BonCommandeFormValues>({
    resolver: zodResolver(bonCommandeSchema),
    defaultValues: initialValues,
  });

  const updateComputedMontant = (quantity: number, unit: number) => {
    if (!Number.isFinite(quantity) || !Number.isFinite(unit)) return;
    setValue('montant', Number((Math.max(1, Math.trunc(quantity)) * unit).toFixed(3)), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const unitField = register('valeurUnitaire', {
    valueAsNumber: true,
    onChange: (event) => {
      const next = Number(event.target.value);
      setUnitValue(next);
      updateComputedMontant(quantityValue, next);
    },
  });

  const quantityField = register('quantiteTotale', {
    valueAsNumber: true,
    onChange: (event) => {
      const next = Number(event.target.value);
      setQuantityValue(next);
      updateComputedMontant(next, unitValue);
    },
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values))} className="form-grid">
      <FormInput label="Numero" {...register('numero')} error={errors.numero?.message} />
      <FormSelect
        label="Type de tickets"
        {...register('typeBon')}
        options={[
          { value: 'restaurant', label: 'Restaurant' },
          { value: 'cafeteria', label: 'Cafeteria' },
        ]}
        error={errors.typeBon?.message}
      />
      <FormInput
        label="Montant total (TND)"
        type="number"
        step="0.01"
        {...register('montant', { valueAsNumber: true })}
        error={errors.montant?.message}
        readOnly
      />
      <FormInput
        label="Valeur unitaire (TND)"
        type="number"
        step="0.01"
        {...unitField}
        error={errors.valeurUnitaire?.message}
      />
      <FormInput
        label="Quantite totale"
        type="number"
        step="1"
        {...quantityField}
        error={errors.quantiteTotale?.message}
      />
      <FormSelect
        label="Fournisseur"
        {...register('fournisseurId')}
        options={(suppliers.data?.items ?? []).map((s) => ({ value: s.id, label: s.nom }))}
        placeholder="Selectionnez un fournisseur"
        error={errors.fournisseurId?.message}
      />
      <FormSelect
        label="Statut"
        {...register('statut')}
        options={[
          { value: 'brouillon', label: 'Brouillon' },
          { value: 'valide', label: 'Valide' },
          { value: 'epuise', label: 'Epuise' },
          { value: 'expire', label: 'Expire' },
        ]}
        error={errors.statut?.message}
      />
      <FormInput
        label="Date d'emission"
        type="date"
        {...register('dateEmission')}
        error={errors.dateEmission?.message}
      />
      <FormInput
        label="Date d'expiration"
        type="date"
        {...register('dateExpiration')}
        error={errors.dateExpiration?.message}
      />
      <div className="form-grid-full offer-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
        <Button type="submit" isLoading={submitting}>
          {initial ? 'Mettre a jour' : 'Creer'}
        </Button>
      </div>
    </form>
  );
}
