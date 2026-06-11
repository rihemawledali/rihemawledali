export interface TreasurerStats {
  soldeActuel: number;
  entreesMois: number;
  sortiesMois: number;
  pretsAValider: number;
  indemnitesATraiter: number;
  retenuesGenerees: number;
  facturesImpayees: number;
  trendSolde: number;
  trendEntrees: number;
  trendSorties: number;
}

export interface MonthlyCashflowPoint {
  mois: string;
  entrees: number;
  sorties: number;
  solde: number;
}

export interface ExpenseSlice {
  categorie: string;
  montant: number;
  color: string;
}

export type PendingRequestType = 'pret_social' | 'indemnite' | 'bon_commande';

export interface PendingRequest {
  id: string;
  reference: string;
  adherent: string;
  type: PendingRequestType;
  montant: number;
  dateDemande: string;
  statut: 'en_attente' | 'a_valider';
}

export type FinancialOperationType = 'entree' | 'sortie' | 'paiement' | 'facture' | 'retenue';

export interface FinancialOperation {
  id: string;
  type: FinancialOperationType;
  description: string;
  montant: number;
  date: string;
  modePaiement: 'virement' | 'espece';
  statut: 'reussi' | 'en_cours' | 'echoue';
}
