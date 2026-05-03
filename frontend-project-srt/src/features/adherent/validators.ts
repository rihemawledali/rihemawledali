/* ============================================
   Validators — Adherent Portal
   ============================================ */

import { z } from 'zod';

const phoneRegex = /^\+?[0-9 ]{8,20}$/;

export const profileSchema = z.object({
  prenom: z.string().min(2, 'Prénom trop court'),
  nom: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  telephone: z.string().regex(phoneRegex, 'Téléphone invalide'),
  dateNaissance: z.string().min(1, 'Date de naissance requise'),
  salaire: z.number({ invalid_type_error: 'Salaire requis' }).min(0, 'Salaire doit être positif'),
  enfants: z.number({ invalid_type_error: 'Nombre d\'enfants requis' }).int().min(0, 'Minimum 0'),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const pretRequestSchema = z.object({
  montant: z.number({ invalid_type_error: 'Montant requis' }).min(100, 'Minimum 100 TND'),
  duree: z.number({ invalid_type_error: 'Durée requise' }).int().min(3, 'Minimum 3 mois').max(60, 'Maximum 60 mois'),
  taux: z.number().min(0).max(10).optional(),
  motif: z.string().min(5, 'Motif trop court (minimum 5 caractères)'),
  documentNom: z.string().optional(),
  documentSize: z.number().optional(),
});

export type PretRequestFormValues = z.infer<typeof pretRequestSchema>;

export const indemniteRequestSchema = z.object({
  type: z.enum(['maladie', 'naissance', 'mariage', 'deces', 'scolarite'], { 
    errorMap: () => ({ message: 'Type d\'indemnité requis' })
  }),
  montant: z.number({ invalid_type_error: 'Montant requis' }).min(1, 'Montant doit être positif'),
  motif: z.string().min(5, 'Motif trop court (minimum 5 caractères)'),
  documentNom: z.string().optional(),
  documentSize: z.number().optional(),
});

export type IndemniteRequestFormValues = z.infer<typeof indemniteRequestSchema>;
