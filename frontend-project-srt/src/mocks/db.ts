/* ============================================
   Mock In-Memory Database
   Seeded once on import, mutated by api.ts
   ============================================ */

import type {
  Utilisateur, Adherent, PretSocial, Adhesion, Indemnite,
  BonCommande, TicketRestaurant, Convention, Fournisseur,
  Facture, Paiement, CompteBancaire, HistoriqueFinanciere,
} from '../types/domain';

import {
  seedUtilisateurs, seedAdherents, seedFournisseurs, seedConventions,
  seedPrets, seedPaiements, seedFactures, seedHistorique,
  seedBonsCommande, seedTicketsRestaurant, seedIndemnites,
  seedComptes, seedAdhesions,
} from './seed';

export interface MockDB {
  utilisateurs: Utilisateur[];
  adherents: Adherent[];
  fournisseurs: Fournisseur[];
  conventions: Convention[];
  prets: PretSocial[];
  paiements: Paiement[];
  factures: Facture[];
  historique: HistoriqueFinanciere[];
  bonsCommande: BonCommande[];
  ticketsRestaurant: TicketRestaurant[];
  indemnites: Indemnite[];
  comptes: CompteBancaire[];
  adhesions: Adhesion[];
}

export const db: MockDB = {
  utilisateurs: [...seedUtilisateurs],
  adherents: [...seedAdherents],
  fournisseurs: [...seedFournisseurs],
  conventions: [...seedConventions],
  prets: [...seedPrets],
  paiements: [...seedPaiements],
  factures: [...seedFactures],
  historique: [...seedHistorique],
  bonsCommande: [...seedBonsCommande],
  ticketsRestaurant: [...seedTicketsRestaurant],
  indemnites: [...seedIndemnites],
  comptes: [...seedComptes],
  adhesions: [...seedAdhesions],
};

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
