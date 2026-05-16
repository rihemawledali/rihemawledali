/* ============================================
   Zod validation schemas
   ============================================ */

import { z } from 'zod';
import { ibanRegex, phoneRegex } from './regex';

export const userSchema = z.object({
  prenom: z.string().min(2, 'Prénom trop court'),
  nom: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  telephone: z.string().regex(phoneRegex, 'Téléphone invalide'),
  role: z.enum(['admin', 'treasurer', 'adherent']),
  status: z.enum(['actif', 'inactif', 'suspendu']),
  matricule: z.string().optional(),
  // Optional on update; required on create (enforced in the form)
  password: z
    .string()
    .min(6, 'Mot de passe : 6 caractères minimum')
    .optional()
    .or(z.literal('')),
});
export type UserFormValues = z.infer<typeof userSchema>;

export const supplierSchema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  adresse: z.string().min(3, 'Adresse requise'),
  telephone: z.string().regex(phoneRegex, 'Téléphone invalide'),
  email: z.string().email('Email invalide'),
  categorie: z.enum(['sante', 'restauration', 'transport', 'loisir', 'commerce', 'education']),
  status: z.enum(['actif', 'inactif']),
});
export type SupplierFormValues = z.infer<typeof supplierSchema>;

export const conventionSchema = z.object({
  fournisseurId: z.string().min(1, 'Fournisseur requis'),
  type: z.enum(['sante', 'restauration', 'transport', 'loisir', 'commerce', 'education']),
  dateDebut: z.string().min(1, 'Date début requise'),
  dateFin: z.string().min(1, 'Date fin requise'),
  statut: z.enum(['active', 'expiree', 'en_negociation', 'suspendue']),
  description: z.string().optional(),

  // ----- Mode d'avantage (required) -----
  typeConvention: z.string().optional(),
  modeAvantage: z.enum(['REMISE_POURCENTAGE', 'REMISE_MONTANT_FIXE'], {
    error: "Mode d'avantage requis",
  }),
  tauxReduction: z
    .number({ error: 'Taux invalide' })
    .min(0, 'Min 0')
    .max(100, 'Max 100')
    .optional(),
  montantReduction: z
    .number({ error: 'Montant invalide' })
    .min(0, 'Min 0')
    .optional(),
}).refine((v) => new Date(v.dateFin) > new Date(v.dateDebut), {
  message: 'La date de fin doit être après la date de début',
  path: ['dateFin'],
}).superRefine((v, ctx) => {
  // Conditional required field per mode d'avantage.
  if (v.modeAvantage === 'REMISE_POURCENTAGE') {
    if (v.tauxReduction == null || Number.isNaN(v.tauxReduction) || v.tauxReduction <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['tauxReduction'],
        message: 'Taux de réduction requis (> 0)',
      });
    }
  }
  if (v.modeAvantage === 'REMISE_MONTANT_FIXE') {
    if (v.montantReduction == null || Number.isNaN(v.montantReduction) || v.montantReduction <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['montantReduction'],
        message: 'Montant requis (> 0)',
      });
    }
  }
});
export type ConventionFormValues = z.infer<typeof conventionSchema>;

/** Bank account (compte bancaire) form — treasurer CRUD. */
export const compteBancaireSchema = z.object({
  banque: z.string().min(2, 'Banque requise'),
  iban: z
    .string()
    .min(10, 'IBAN trop court')
    .max(40, 'IBAN trop long')
    // Accept spaces for readability; trimmed server-side.
    .regex(ibanRegex, 'IBAN invalide'),
  solde: z
    .number({ error: 'Solde invalide' })
    .min(0, 'Solde négatif interdit'),
  devise: z.enum(['TND', 'EUR', 'USD']),
});
export type CompteBancaireFormValues = z.infer<typeof compteBancaireSchema>;

export const paiementSchema = z.object({
  reference: z.string().min(2, 'Référence requise'),
  typePaiement: z.enum(['PAIEMENT_FACTURE_FOURNISSEUR', 'PAIEMENT_INDEMNITE', 'AUTRE_SORTIE']),
  beneficiaireType: z.enum(['FOURNISSEUR', 'ADHERENT', 'AUTRE']),
  beneficiaireId: z.string().optional(),
  beneficiaire: z.string().min(2, 'Bénéficiaire requis'),
  montant: z.number({ error: 'Montant requis' }).positive('Montant > 0'),
  mode: z.enum(['virement', 'cheque', 'especes', 'carte']),
  statut: z.enum(['reussi', 'en_attente', 'echoue', 'rembourse']),
  factureId: z.string().optional(),
  factureNumero: z.string().optional(),
  indemniteId: z.string().optional(),
  description: z.string().optional(),
  compteBancaireId: z.string().min(1, 'Compte bancaire requis'),
});
export type PaiementFormValues = z.infer<typeof paiementSchema>;

export const factureSchema = z.object({
  numero: z.string().min(2, 'Numéro requis'),
  fournisseurId: z.string().min(1, 'Fournisseur requis'),
  montant: z.number({ error: 'Montant requis' }).positive('Montant > 0'),
  statut: z.enum(['brouillon', 'non_payee', 'impayee', 'en_retard', 'partielle', 'payee', 'annulee']),
  dateEmission: z.string().min(1),
  dateEcheance: z.string().min(1),
  description: z.string().optional(),
});
export type FactureFormValues = z.infer<typeof factureSchema>;

export const bonCommandeSchema = z.object({
  numero: z.string().min(2, 'Numéro requis'),
  fournisseurId: z.string().min(1),
  adherentId: z.string().optional(),
  typeBon: z.enum(['restaurant', 'cafeteria']),
  montant: z.number({ error: 'Montant requis' }).positive(),
  valeurUnitaire: z.number({ error: 'Valeur unitaire requise' }).positive(),
  quantiteTotale: z.number({ error: 'Quantité requise' }).int().positive(),
  statut: z.enum(['brouillon', 'valide', 'epuise', 'expire']),
  dateEmission: z.string().min(1),
  dateExpiration: z.string().min(1),
});
export type BonCommandeFormValues = z.infer<typeof bonCommandeSchema>;

export const ticketAssignSchema = z.object({
  bonCommandeId: z.string().min(1, 'Bon de commande requis'),
  adherentId: z.string().min(1, 'Adhérent requis'),
  quantite: z.number({ error: 'Quantité requise' }).int().positive('Quantité > 0'),
});
export type TicketAssignFormValues = z.infer<typeof ticketAssignSchema>;

export const ticketSchema = z.object({
  numero: z.string().min(2),
  typeBon: z.enum(['restaurant', 'cafeteria']),
  montant: z.number({ error: 'Montant requis' }).positive(),
  statut: z.enum(['en_attente', 'attribue', 'utilise', 'expire']),
  adherentId: z.string().optional(),
  dateEmission: z.string().min(1),
});
export type TicketFormValues = z.infer<typeof ticketSchema>;
