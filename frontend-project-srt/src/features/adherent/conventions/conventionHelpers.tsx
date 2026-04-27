/* ============================================
   Convention Helpers — Adherent Portal
   Shared display logic between all conventions pages.
   ============================================ */

import {
  Stethoscope, UtensilsCrossed, Bus, GraduationCap, Film, Store,
} from 'lucide-react';
import type {
  ConventionType,
  ConventionAdherentStatus,
  ConventionDemandeStatut,
} from '../../../types/domain';

export const CONV_TYPE_LABEL: Record<ConventionType, string> = {
  sante: 'Santé',
  restauration: 'Restauration',
  transport: 'Transport',
  loisir: 'Loisirs',
  commerce: 'Commerce',
  education: 'Éducation',
};

export const CONV_TYPE_ICON: Record<ConventionType, typeof Stethoscope> = {
  sante: Stethoscope,
  restauration: UtensilsCrossed,
  transport: Bus,
  loisir: Film,
  commerce: Store,
  education: GraduationCap,
};

export const CONV_TYPE_TONE: Record<
  ConventionType,
  'primary' | 'success' | 'warning' | 'info' | 'violet' | 'error'
> = {
  sante: 'error',
  restauration: 'warning',
  transport: 'info',
  loisir: 'violet',
  commerce: 'primary',
  education: 'success',
};

// ----- Adherent-facing convention status -----

export const ADHERENT_STATUS_LABEL: Record<ConventionAdherentStatus, string> = {
  disponible: 'Disponible',
  deja_demandee: 'Déjà demandée',
  active: 'Active',
  expiree: 'Expirée',
  non_disponible: 'Non disponible',
};

/**
 * Visual variant for the adherent-status badge.
 * Maps directly to the colors referenced in the spec.
 */
export const ADHERENT_STATUS_VARIANT: Record<
  ConventionAdherentStatus,
  'success' | 'warning' | 'info' | 'neutral' | 'error'
> = {
  disponible: 'success',
  deja_demandee: 'warning',
  active: 'info',
  expiree: 'neutral',
  non_disponible: 'error',
};

// ----- Demande status (en_attente / validee / refusee / annulee) -----

export const DEMANDE_STATUS_LABEL: Record<ConventionDemandeStatut, string> = {
  en_attente: 'En attente',
  validee: 'Validée',
  refusee: 'Refusée',
  annulee: 'Annulée',
};

export const DEMANDE_STATUS_VARIANT: Record<
  ConventionDemandeStatut,
  'success' | 'warning' | 'info' | 'neutral' | 'error'
> = {
  en_attente: 'warning',
  validee: 'success',
  refusee: 'error',
  annulee: 'neutral',
};
