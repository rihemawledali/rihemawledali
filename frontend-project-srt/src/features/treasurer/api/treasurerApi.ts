/* ============================================
   Treasurer API — backed by /api/treasurer/*
   --------------------------------------------------
   Replaces the legacy mock implementation. Exposes the same shape
   the dashboard page consumes (stats / cashflow / breakdown / pending
   requests / recent operations) but everything is computed from real
   backend data:
     - stats        ← /api/treasurer/dashboard/stats
     - cashflow     ← derived from /api/treasurer/historique (last 12 months)
     - breakdown    ← derived from /api/treasurer/historique (current month)
     - pending      ← merge of adhesions / prets / indemnites en_attente
     - operations   ← /api/treasurer/historique (limited)
   ============================================ */

import { get } from '../../../lib/apiClient';
import type {
  TreasurerStats,
  MonthlyCashflowPoint,
  ExpenseSlice,
  PendingRequest,
  PendingRequestType,
  FinancialOperation,
} from './treasurerMockData';

// ---------------- Types from the backend ----------------

interface TreasurerStatsDtoBE {
  soldeTotal: number;
  deviseAffichage: string;
  facturesNonPayees: number;
  facturesEnRetard: number;
  indemnitesEnAttente: number;
  indemnitesValidees: number;
  pretsEnAttente: number;
  adhesionsEnAttente: number;
  retenuesGenerees: number;
  retenuesConfirmees: number;
  comptes: Array<{ id: string; banque: string; iban: string; solde: number; devise: string }>;
}

interface HistoriqueTresorerieDtoBE {
  id: string;
  type: 'entree' | 'sortie';
  sourceType?: string | null;
  sourceRefId?: string | null;
  description?: string | null;
  montant: number;
  date: string;
  reference?: string | null;
  modePaiement?: string | null;
  statut?: string | null;
  utilisateur?: string | null;
}

interface AdhesionDtoBE {
  id: string;
  adherentId: string;
  adherentNom: string;
  dateDebut: string;
  dateFin: string;
  montantCotisation: number;
  statut: string;
}

interface PretDtoBE {
  id: string;
  adherentId: string;
  adherentNom: string;
  montant: number;
  duree: number;
  taux: number;
  statut: string;
  dateDemande: string;
}

interface IndemniteDtoBE {
  id: string;
  adherentId: string;
  adherentNom: string;
  type: string;
  montant: number;
  statut: string;
  dateDemande: string;
}

// ---------------- Helpers ----------------

const MONTHS_FR = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

const ymKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const round0 = (n: number) => Math.round(n);

function modePaiementOf(value?: string | null): FinancialOperation['modePaiement'] {
  switch ((value ?? '').toLowerCase()) {
    case 'virement': return 'virement';
    case 'cheque': return 'cheque';
    case 'especes': return 'espece';
    case 'espece': return 'espece';
    case 'prelevement': return 'prelevement';
    default: return 'virement';
  }
}

function statutOf(value?: string | null): FinancialOperation['statut'] {
  switch ((value ?? '').toLowerCase()) {
    case 'reussi': return 'reussi';
    case 'echoue': return 'echoue';
    case 'rembourse': return 'echoue';
    case 'en_attente': return 'en_cours';
    default: return 'reussi';
  }
}

function operationTypeOf(h: HistoriqueTresorerieDtoBE): FinancialOperation['type'] {
  if (h.sourceType === 'FACTURE') return 'facture';
  if (h.sourceType === 'RETENUE') return 'retenue';
  if (h.sourceType === 'INDEMNITE') return 'paiement';
  return h.type === 'entree' ? 'entree' : 'sortie';
}

// ---------------- Public API ----------------

export const treasurerApi = {
  async getStats(): Promise<TreasurerStats> {
    const [statsRes, histRes] = await Promise.all([
      get<TreasurerStatsDtoBE>('/api/treasurer/dashboard/stats'),
      get<HistoriqueTresorerieDtoBE[]>('/api/treasurer/historique'),
    ]);
    const stats = statsRes.data;

    // Aggregate current-month entrées/sorties from historique.
    const now = new Date();
    const currentKey = ymKey(now);
    let entreesMois = 0;
    let sortiesMois = 0;
    for (const h of histRes.data) {
      if (h.date?.slice(0, 7) !== currentKey) continue;
      if (h.montant > 0) entreesMois += h.montant;
      else sortiesMois += Math.abs(h.montant);
    }

    return {
      soldeActuel: stats.soldeTotal,
      entreesMois,
      sortiesMois,
      demandesAdhesion: stats.adhesionsEnAttente,
      pretsAValider: stats.pretsEnAttente,
      indemnitesATraiter: stats.indemnitesEnAttente,
      retenuesGenerees: stats.retenuesGenerees,
      facturesImpayees: stats.facturesNonPayees + stats.facturesEnRetard,
      // Trends not modeled on the backend yet — surface 0 so the UI stays consistent.
      trendSolde: 0,
      trendEntrees: 0,
      trendSorties: 0,
    };
  },

  async getCashflow(): Promise<MonthlyCashflowPoint[]> {
    const { data } = await get<HistoriqueTresorerieDtoBE[]>('/api/treasurer/historique');

    // Bucket by yyyy-MM for the last 12 months.
    const buckets = new Map<string, { entrees: number; sorties: number }>();
    const now = new Date();
    const orderedKeys: { key: string; mois: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = ymKey(d);
      buckets.set(key, { entrees: 0, sorties: 0 });
      orderedKeys.push({ key, mois: MONTHS_FR[d.getMonth()] });
    }
    for (const h of data) {
      const key = (h.date ?? '').slice(0, 7);
      const slot = buckets.get(key);
      if (!slot) continue;
      if (h.montant > 0) slot.entrees += h.montant;
      else slot.sorties += Math.abs(h.montant);
    }

    let solde = 0;
    return orderedKeys.map(({ key, mois }) => {
      const b = buckets.get(key)!;
      solde += b.entrees - b.sorties;
      return {
        mois,
        entrees: round0(b.entrees),
        sorties: round0(b.sorties),
        solde: round0(solde),
      };
    });
  },

  async getExpenseBreakdown(): Promise<ExpenseSlice[]> {
    const { data } = await get<HistoriqueTresorerieDtoBE[]>('/api/treasurer/historique');
    const now = new Date();
    const currentKey = ymKey(now);

    const acc = {
      prets: 0,
      indemnites: 0,
      tickets: 0,
      factures: 0,
      autres: 0,
    };
    for (const h of data) {
      if (h.date?.slice(0, 7) !== currentKey) continue;
      if (h.montant >= 0) continue;
      const abs = Math.abs(h.montant);
      switch (h.sourceType) {
        case 'FACTURE': acc.factures += abs; break;
        case 'INDEMNITE': acc.indemnites += abs; break;
        case 'RETENUE': acc.autres += abs; break;
        default: acc.autres += abs;
      }
    }

    const slices: ExpenseSlice[] = [
      { categorie: 'Prêts sociaux',         montant: round0(acc.prets),      color: '#3b82f6' },
      { categorie: 'Indemnités',            montant: round0(acc.indemnites), color: '#10b981' },
      { categorie: 'Tickets restaurant',    montant: round0(acc.tickets),    color: '#f59e0b' },
      { categorie: 'Factures fournisseurs', montant: round0(acc.factures),   color: '#ef4444' },
      { categorie: 'Autres opérations',     montant: round0(acc.autres),     color: '#8b5cf6' },
    ];
    return slices.filter((s) => s.montant > 0);
  },

  async getPendingRequests(): Promise<PendingRequest[]> {
    const [adhRes, pretRes, indRes] = await Promise.all([
      get<AdhesionDtoBE[]>('/api/treasurer/adhesions'),
      get<PretDtoBE[]>('/api/treasurer/prets'),
      get<IndemniteDtoBE[]>('/api/treasurer/indemnites'),
    ]);

    const out: PendingRequest[] = [];

    for (const a of adhRes.data) {
      if (a.statut !== 'en_attente') continue;
      out.push({
        id: `adh-${a.id}`,
        reference: `ADH-${a.id}`,
        adherent: a.adherentNom,
        type: 'adhesion' as PendingRequestType,
        montant: a.montantCotisation,
        dateDemande: a.dateDebut,
        statut: 'en_attente',
      });
    }
    for (const p of pretRes.data) {
      if (p.statut !== 'en_attente') continue;
      out.push({
        id: `pret-${p.id}`,
        reference: `PRT-${p.id}`,
        adherent: p.adherentNom,
        type: 'pret_social' as PendingRequestType,
        montant: p.montant,
        dateDemande: p.dateDemande,
        statut: 'a_valider',
      });
    }
    for (const i of indRes.data) {
      if (i.statut !== 'en_attente') continue;
      out.push({
        id: `ind-${i.id}`,
        reference: `IND-${i.id}`,
        adherent: i.adherentNom,
        type: 'indemnite' as PendingRequestType,
        montant: i.montant,
        dateDemande: i.dateDemande,
        statut: 'en_attente',
      });
    }

    out.sort((a, b) => b.dateDemande.localeCompare(a.dateDemande));
    return out.slice(0, 20);
  },

  async getRecentOperations(): Promise<FinancialOperation[]> {
    const { data } = await get<HistoriqueTresorerieDtoBE[]>('/api/treasurer/historique');
    return data.slice(0, 12).map((h) => ({
      id: h.reference ?? h.id,
      type: operationTypeOf(h),
      description: h.description ?? '',
      montant: h.montant,
      date: (h.date ?? '').slice(0, 10),
      modePaiement: modePaiementOf(h.modePaiement),
      statut: statutOf(h.statut),
    }));
  },
};
