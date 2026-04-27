/* ============================================
   Zod validation schemas
   ============================================ */

import { z } from 'zod';

const phoneRegex = /^\+?[0-9 ]{8,20}$/;

export const userSchema = z.object({
  prenom: z.string().min(2, 'Prénom trop court'),
  nom: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  telephone: z.string().regex(phoneRegex, 'Téléphone invalide'),
  role: z.enum(['admin', 'treasurer', 'manager', 'adherent']),
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
  remise: z.number({ error: 'Remise invalide' }).min(0, 'Min 0').max(100, 'Max 100'),
  statut: z.enum(['active', 'expiree', 'en_negociation', 'suspendue']),
  description: z.string().optional(),
}).refine((v) => new Date(v.dateFin) > new Date(v.dateDebut), {
  message: 'La date de fin doit être après la date de début',
  path: ['dateFin'],
});
export type ConventionFormValues = z.infer<typeof conventionSchema>;

export const paiementSchema = z.object({
  reference: z.string().min(2, 'Référence requise'),
  beneficiaire: z.string().min(2, 'Bénéficiaire requis'),
  montant: z.number({ error: 'Montant requis' }).positive('Montant > 0'),
  mode: z.enum(['virement', 'cheque', 'especes', 'carte']),
  statut: z.enum(['reussi', 'en_attente', 'echoue', 'rembourse']),
  factureNumero: z.string().optional(),
});
export type PaiementFormValues = z.infer<typeof paiementSchema>;

export const factureSchema = z.object({
  numero: z.string().min(2, 'Numéro requis'),
  fournisseurId: z.string().min(1, 'Fournisseur requis'),
  montant: z.number({ error: 'Montant requis' }).positive('Montant > 0'),
  statut: z.enum(['payee', 'impayee', 'en_retard', 'partielle']),
  dateEmission: z.string().min(1),
  dateEcheance: z.string().min(1),
});
export type FactureFormValues = z.infer<typeof factureSchema>;

export const bonCommandeSchema = z.object({
  numero: z.string().min(2, 'Numéro requis'),
  fournisseurId: z.string().min(1),
  adherentId: z.string().optional(),
  montant: z.number({ error: 'Montant requis' }).positive(),
  statut: z.enum(['en_attente', 'attribue', 'utilise', 'expire']),
  dateEmission: z.string().min(1),
  dateExpiration: z.string().min(1),
});
export type BonCommandeFormValues = z.infer<typeof bonCommandeSchema>;

export const ticketSchema = z.object({
  numero: z.string().min(2),
  typeBon: z.enum(['restaurant', 'cafeteria']),
  montant: z.number({ error: 'Montant requis' }).positive(),
  statut: z.enum(['en_attente', 'attribue', 'utilise', 'expire']),
  adherentId: z.string().optional(),
  dateEmission: z.string().min(1),
});
export type TicketFormValues = z.infer<typeof ticketSchema>;
