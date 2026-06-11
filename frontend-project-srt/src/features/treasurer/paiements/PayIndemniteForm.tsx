/* ============================================
   Form: Pay a validated indemnité
   Used from TreasurerIndemnitesPage and PaiementsPage (?indemniteId=…).
   ============================================ */

import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { FormInput } from '../../../shared/ui/FormInput';
import { FormSelect } from '../../../shared/ui/FormSelect';
import { Button } from '../../../shared/ui/Button';
import { DetailField } from '../../../shared/ui/DetailField';
import { formatCurrency } from '../../../shared/lib/formatters';
import { treasurerTresorerieApi } from '../api/treasurerListApi';
import type { PaiementMode, CompteBancaire } from '../../../shared/types/domain';

const TYPE_LABEL: Record<string, string> = {
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
  compteBancaireId: string;
}

function createPaymentReference() {
  return `PAY-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
}

export function PayIndemniteForm({ indemnite, onSubmit, onCancel, submitting }: any) {
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
      montant: indemnite.montant,
      mode: 'virement',
      description: `Paiement indemnité ${indemnite.id.toUpperCase()} (${TYPE_LABEL[indemnite.type]})`,
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
      <div className="form-grid-full form-read-grid">
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
          { value: 'especes', label: 'Espèces' },
        ]}
      />
      <div className="form-grid-full">
        <FormInput label="Description (optionnel)" {...register('description')} />
      </div>

      <div className="form-grid-full form-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting || comptesLoading}>Annuler</Button>
        <Button type="submit" isLoading={submitting || comptesLoading} disabled={comptes.length === 0}>Payer l'indemnité</Button>
      </div>
    </form>
  );
}

function ReadField(props: any) {
  return (
    <DetailField
      {...props}
      className=""
      labelClassName="read-field-label"
      valueClassName="read-field-value"
      strongValue
    />
  );
}
