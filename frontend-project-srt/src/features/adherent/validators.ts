/* ============================================
   Validators - Adherent Portal
   ============================================ */

import { z } from 'zod';

export const pretRequestSchema = z.object({
  montant: z.number({ error: 'Montant requis' }).min(100, 'Minimum 100 TND'),
  duree: z.number({ error: 'Duree requise' }).int().min(3, 'Minimum 3 mois').max(60, 'Maximum 60 mois'),
  taux: z.number().min(0).max(10).optional(),
  motif: z.string().min(5, 'Motif trop court (minimum 5 caracteres)'),
  documentNom: z.string().optional(),
  documentSize: z.number().optional(),
});

export type PretRequestFormValues = z.infer<typeof pretRequestSchema>;

export const indemniteRequestSchema = z.object({
  type: z.enum(['maladie', 'naissance', 'mariage', 'deces', 'scolarite'] as const, {
    error: 'Type indemnite requis',
  }),
  montant: z.number({ error: 'Montant requis' }).min(1, 'Montant doit etre positif'),
  motif: z.string().min(5, 'Motif trop court (minimum 5 caracteres)'),
  documentNom: z.string().optional(),
  documentSize: z.number().optional(),
});

export type IndemniteRequestFormValues = z.infer<typeof indemniteRequestSchema>;
