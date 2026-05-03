/* ============================================
   Treasurer — Mock Data
   Replace with real API responses when backend is ready.
   ============================================ */

export interface TreasurerStats {
  soldeActuel: number;
  entreesMois: number;
  sortiesMois: number;
  demandesAdhesion: number;
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

export type PendingRequestType =
  | 'adhesion'
  | 'pret_social'
  | 'indemnite'
  | 'bon_commande';

export interface PendingRequest {
  id: string;
  reference: string;
  adherent: string;
  type: PendingRequestType;
  montant: number;
  dateDemande: string;
  statut: 'en_attente' | 'a_valider';
}

export type FinancialOperationType =
  | 'entree'
  | 'sortie'
  | 'paiement'
  | 'facture'
  | 'retenue';

export interface FinancialOperation {
  id: string;
  type: FinancialOperationType;
  description: string;
  montant: number; // positive = entree, negative = sortie
  date: string;
  modePaiement: 'virement' | 'cheque' | 'espece' | 'prelevement';
  statut: 'reussi' | 'en_cours' | 'echoue';
}

// ----- Stats -----
export const mockTreasurerStats: TreasurerStats = {
  soldeActuel: 184_350,
  entreesMois: 28_700,
  sortiesMois: 19_420,
  demandesAdhesion: 7,
  pretsAValider: 5,
  indemnitesATraiter: 4,
  retenuesGenerees: 142,
  facturesImpayees: 3,
  trendSolde: 6.8,
  trendEntrees: 4.2,
  trendSorties: -2.3,
};

// ----- Cashflow over the last 12 months -----
const MONTHS_FR = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

export const mockMonthlyCashflow: MonthlyCashflowPoint[] = (() => {
  const out: MonthlyCashflowPoint[] = [];
  const now = new Date();
  let solde = 150_000;
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const entrees = 22_000 + Math.round(Math.sin(i) * 4000) + Math.round(Math.random() * 3000);
    const sorties = 16_000 + Math.round(Math.cos(i) * 3000) + Math.round(Math.random() * 2500);
    solde += entrees - sorties;
    out.push({
      mois: MONTHS_FR[d.getMonth()],
      entrees,
      sorties,
      solde,
    });
  }
  return out;
})();

// ----- Expense breakdown -----
export const mockExpenseBreakdown: ExpenseSlice[] = [
  { categorie: 'Prêts sociaux',         montant: 7_800, color: '#3b82f6' },
  { categorie: 'Indemnités',            montant: 3_400, color: '#10b981' },
  { categorie: 'Tickets restaurant',    montant: 2_950, color: '#f59e0b' },
  { categorie: 'Factures fournisseurs', montant: 4_120, color: '#ef4444' },
  { categorie: 'Autres opérations',     montant: 1_150, color: '#8b5cf6' },
];

// ----- Pending requests -----
export const mockPendingRequests: PendingRequest[] = [
  { id: 'req-001', reference: 'ADH-2026-018', adherent: 'Salma Ben Salah',  type: 'adhesion',     montant: 50,    dateDemande: '2026-04-26', statut: 'en_attente' },
  { id: 'req-002', reference: 'PRT-2026-012', adherent: 'Mohamed Kefi',     type: 'pret_social',  montant: 4_500, dateDemande: '2026-04-25', statut: 'a_valider' },
  { id: 'req-003', reference: 'IND-2026-007', adherent: 'Houda Trabelsi',   type: 'indemnite',    montant: 320,   dateDemande: '2026-04-24', statut: 'en_attente' },
  { id: 'req-004', reference: 'BC-2026-031',  adherent: 'Karim Mansouri',   type: 'bon_commande', montant: 180,   dateDemande: '2026-04-23', statut: 'a_valider' },
  { id: 'req-005', reference: 'PRT-2026-013', adherent: 'Amira Gharbi',     type: 'pret_social',  montant: 2_800, dateDemande: '2026-04-22', statut: 'en_attente' },
  { id: 'req-006', reference: 'ADH-2026-019', adherent: 'Walid Hammami',    type: 'adhesion',     montant: 50,    dateDemande: '2026-04-21', statut: 'en_attente' },
  { id: 'req-007', reference: 'IND-2026-008', adherent: 'Yasmine Bouzid',   type: 'indemnite',    montant: 540,   dateDemande: '2026-04-20', statut: 'a_valider' },
];

// ----- Recent operations -----
export const mockRecentOperations: FinancialOperation[] = [
  { id: 'OP-10245', type: 'entree',   description: 'Cotisations adhésion (lot avril)',     montant:  6_800, date: '2026-04-28', modePaiement: 'prelevement', statut: 'reussi' },
  { id: 'OP-10244', type: 'sortie',   description: 'Décaissement prêt social – M. Kefi',  montant: -4_500, date: '2026-04-27', modePaiement: 'virement',    statut: 'reussi' },
  { id: 'OP-10243', type: 'paiement', description: 'Paiement facture FAC-2026-0042',       montant: -1_120, date: '2026-04-26', modePaiement: 'cheque',      statut: 'en_cours' },
  { id: 'OP-10242', type: 'facture',  description: 'Facture fournisseur – Imprimerie Béja',montant: -  640, date: '2026-04-25', modePaiement: 'virement',    statut: 'reussi' },
  { id: 'OP-10241', type: 'retenue',  description: 'Retenue mensuelle – avril 2026',       montant:  9_350, date: '2026-04-24', modePaiement: 'prelevement', statut: 'reussi' },
  { id: 'OP-10240', type: 'sortie',   description: 'Indemnité – H. Trabelsi',              montant: -  320, date: '2026-04-23', modePaiement: 'virement',    statut: 'reussi' },
  { id: 'OP-10239', type: 'paiement', description: 'Paiement tickets restaurant',          montant: -2_950, date: '2026-04-22', modePaiement: 'virement',    statut: 'reussi' },
  { id: 'OP-10238', type: 'entree',   description: 'Remboursement prêt – A. Gharbi',       montant:    600, date: '2026-04-21', modePaiement: 'prelevement', statut: 'reussi' },
];
