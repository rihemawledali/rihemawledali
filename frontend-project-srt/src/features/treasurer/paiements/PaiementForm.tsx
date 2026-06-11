import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { paiementSchema, type PaiementFormValues } from '../../../shared/validators';
import { FormInput } from '../../../shared/ui/FormInput';
import { FormSelect } from '../../../shared/ui/FormSelect';
import { Button } from '../../../shared/ui/Button';
import { treasurerTresorerieApi } from '../api/treasurerListApi';
import type { CompteBancaire } from '../../../shared/types/domain';

function createPaymentReference() {
  return `PAY-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
}

function createPaiementDefaults(initial?: Paiement): PaiementFormValues {
  if (initial) {
    return {
      reference: initial.reference,
      typePaiement: initial.typePaiement ?? 'AUTRE_SORTIE',
      beneficiaireType: initial.beneficiaireType ?? 'AUTRE',
      beneficiaireId: initial.beneficiaireId ?? '',
      beneficiaire: initial.beneficiaire,
      montant: initial.montant,
      mode: initial.mode,
      statut: initial.statut,
      factureId: initial.factureId ?? '',
      factureNumero: initial.factureNumero ?? '',
      indemniteId: initial.indemniteId ?? '',
      description: initial.description ?? '',
      compteBancaireId: initial.compteBancaireId ?? '',
    };
  }

  return {
    reference: createPaymentReference(),
    typePaiement: 'AUTRE_SORTIE',
    beneficiaireType: 'AUTRE',
    beneficiaireId: '',
    beneficiaire: '',
    montant: 0,
    mode: 'virement',
    statut: 'reussi',
    factureId: '',
    factureNumero: '',
    indemniteId: '',
    description: '',
    compteBancaireId: '',
  };
}

export function PaiementForm({ initial, onSubmit, onCancel, submitting }: any) {
  const [defaultValues] = useState(() => createPaiementDefaults(initial));
  const [comptes, setComptes] = useState<CompteBancaire[]>([]);
  const [comptesLoading, setComptesLoading] = useState(true);

  useEffect(() => {
    treasurerTresorerieApi.listComptes()
      .then(setComptes)
      .finally(() => setComptesLoading(false));
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<PaiementFormValues>({
    resolver: zodResolver(paiementSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
      <FormSelect
        label="Compte bancaire"
        {...register('compteBancaireId')}
        options={comptesLoading ? [{ value: '', label: 'Chargement...' }] : [
          { value: '', label: 'Sélectionner un compte' },
          ...comptes.map((c) => ({ value: c.id, label: `${c.banque} — ${c.iban} (${c.solde.toFixed(2)} ${c.devise})` })),
        ]}
        error={errors.compteBancaireId?.message}
      />
      <FormInput label="Référence" {...register('reference')} error={errors.reference?.message} />
      <FormSelect
        label="Type de paiement"
        {...register('typePaiement')}
        options={[
          { value: 'PAIEMENT_FACTURE_FOURNISSEUR', label: 'Paiement facture fournisseur' },
          { value: 'PAIEMENT_INDEMNITE', label: 'Paiement indemnité' },
          { value: 'AUTRE_SORTIE', label: 'Autre sortie' },
        ]}
        error={errors.typePaiement?.message}
      />
      <FormInput label="Bénéficiaire" {...register('beneficiaire')} error={errors.beneficiaire?.message} />
      <FormInput label="Montant (TND)" type="number" step="0.01" {...register('montant', { valueAsNumber: true })} error={errors.montant?.message} />
      <FormSelect label="Mode" {...register('mode')} options={[
        { value: 'virement', label: 'Virement' },
        { value: 'especes', label: 'Espèces' },
      ]} error={errors.mode?.message} />
      <FormSelect label="Statut" {...register('statut')} options={[
        { value: 'reussi', label: 'Réussi' },
        { value: 'en_attente', label: 'En attente' },
        { value: 'echoue', label: 'Échoué' },
        { value: 'rembourse', label: 'Remboursé' },
      ]} error={errors.statut?.message} />
      <FormInput label="N° facture (optionnel)" {...register('factureNumero')} error={errors.factureNumero?.message} />
      <div className="form-grid-full">
        <FormInput label="Description (optionnel)" {...register('description')} error={errors.description?.message} />
      </div>
      <div className="form-grid-full form-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting || comptesLoading}>Annuler</Button>
        <Button type="submit" isLoading={submitting || comptesLoading} disabled={comptes.length === 0}>{initial ? 'Mettre à jour' : 'Créer'}</Button>
      </div>
    </form>
  );
}
