/* ============================================
   Zod validation schemas
   ============================================ */

import { z } from 'zod';
import { ibanRegex, phoneRegex } from './regex';

export const userSchema = z.object({
  prenom: z.string().min(2, 'Prenom trop court'),
  nom: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  telephone: z.string().regex(phoneRegex, 'Telephone invalide'),
  role: z.enum(['admin', 'treasurer', 'adherent']),
  status: z.enum(['actif', 'inactif', 'suspendu']),
  matricule: z.string().optional(),
  password: z
    .string()
    .min(6, 'Mot de passe : 6 caracteres minimum')
    .optional()
    .or(z.literal('')),
});
export type UserFormValues = z.infer<typeof userSchema>;

export const supplierSchema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  adresse: z.string().min(3, 'Adresse requise'),
  telephone: z.string().regex(phoneRegex, 'Telephone invalide'),
  email: z.string().email('Email invalide'),
  categorie: z.enum(['sante', 'restauration', 'transport', 'loisir', 'commerce', 'education']),
  status: z.enum(['actif', 'inactif']),
});
export type SupplierFormValues = z.infer<typeof supplierSchema>;

export const conventionSchema = z.object({
  fournisseurId: z.string().min(1, 'Fournisseur requis'),
  type: z.enum(['sante', 'restauration', 'transport', 'loisir', 'commerce', 'education']),
  dateDebut: z.string().min(1, 'Date debut requise'),
  dateFin: z.string().min(1, 'Date fin requise'),
  statut: z.enum(['active', 'expiree', 'en_negociation', 'suspendue']),
  description: z.string().optional(),
  typeConvention: z.string().optional(),
  typeAvantage: z.enum(['REMISE_DIRECTE', 'ACHAT_TRANCHE', 'ABONNEMENT', 'BON_ACHAT'], {
    error: "Type d'avantage requis",
  }),
  pourcentageAdherent: z.number({ error: 'Pourcentage invalide' }).min(0).max(100).optional(),
  montantAvantage: z.number({ error: 'Montant invalide' }).min(0).optional(),
  nombreMoisRetenue: z.number({ error: 'Nombre de mois invalide' }).int().positive().optional(),
  quantiteDisponible: z.number({ error: 'Quantite invalide' }).int().min(0).optional(),
  autoriseAyantsDroit: z.boolean().optional(),
}).refine((v) => new Date(v.dateFin) > new Date(v.dateDebut), {
  message: 'La date de fin doit etre apres la date de debut',
  path: ['dateFin'],
}).superRefine((v, ctx) => {
  if (v.typeAvantage !== 'REMISE_DIRECTE') {
    if (v.montantAvantage == null || Number.isNaN(v.montantAvantage) || v.montantAvantage <= 0) {
      ctx.addIssue({ code: 'custom', path: ['montantAvantage'], message: 'Montant requis (> 0)' });
    }
    if (v.pourcentageAdherent == null || Number.isNaN(v.pourcentageAdherent)) {
      ctx.addIssue({ code: 'custom', path: ['pourcentageAdherent'], message: 'Pourcentage adherent requis' });
    }
  }
  if (v.typeAvantage === 'ACHAT_TRANCHE' && (v.nombreMoisRetenue == null || Number.isNaN(v.nombreMoisRetenue))) {
    ctx.addIssue({ code: 'custom', path: ['nombreMoisRetenue'], message: 'Nombre de mois requis' });
  }
});
export type ConventionFormValues = z.infer<typeof conventionSchema>;

export const compteBancaireSchema = z.object({
  banque: z.string().min(2, 'Banque requise'),
  iban: z
    .string()
    .min(10, 'IBAN trop court')
    .max(40, 'IBAN trop long')
    .regex(ibanRegex, 'IBAN invalide'),
  solde: z
    .number({ error: 'Solde invalide' })
    .min(0, 'Solde negatif interdit'),
  devise: z.enum(['TND', 'EUR', 'USD']),
});
export type CompteBancaireFormValues = z.infer<typeof compteBancaireSchema>;

export const paiementSchema = z.object({
  reference: z.string().min(2, 'Reference requise'),
  typePaiement: z.enum(['PAIEMENT_FACTURE_FOURNISSEUR', 'PAIEMENT_INDEMNITE', 'AUTRE_SORTIE']),
  beneficiaireType: z.enum(['FOURNISSEUR', 'ADHERENT', 'AUTRE']),
  beneficiaireId: z.string().optional(),
  beneficiaire: z.string().min(2, 'Beneficiaire requis'),
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

export const bonCommandeSchema = z.object({
  numero: z.string().min(2, 'Numero requis'),
  fournisseurId: z.string().min(1),
  adherentId: z.string().optional(),
  typeBon: z.enum(['restaurant', 'cafeteria']),
  montant: z.number({ error: 'Montant requis' }).positive(),
  valeurUnitaire: z.number({ error: 'Valeur unitaire requise' }).positive(),
  quantiteTotale: z.number({ error: 'Quantite requise' }).int().positive(),
  statut: z.enum(['brouillon', 'valide', 'epuise', 'expire']),
  dateEmission: z.string().min(1),
  dateExpiration: z.string().min(1),
});
export type BonCommandeFormValues = z.infer<typeof bonCommandeSchema>;

export const ticketAssignSchema = z.object({
  bonCommandeId: z.string().min(1, 'Bon de commande requis'),
  adherentId: z.string().min(1, 'Adherent requis'),
  quantite: z.number({ error: 'Quantite requise' }).int().positive('Quantite > 0'),
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
