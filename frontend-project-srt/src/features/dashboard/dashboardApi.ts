import { db } from '../../mocks/db';

const delay = <T,>(v: T, ms = 200) => new Promise<T>((r) => setTimeout(() => r(v), ms));

export interface DashboardStats {
  totalAdherents: number;
  pretsActifs: number;
  revenuTotal: number;
  demandesEnAttente: number;
  conventionsActives: number;
  fournisseursActifs: number;
  // delta (vs last period) — synthetic
  trendAdherents: number;
  trendRevenu: number;
  trendPrets: number;
  trendDemandes: number;
}

export interface MonthlyPoint { month: string; revenu: number; depenses: number }
export interface OperationsByType { type: string; total: number }
export interface PretsByStatus { name: string; value: number; color: string }

export const dashboardApi = {
  stats: async (): Promise<DashboardStats> => {
    const totalAdherents = db.adherents.length;
    const pretsActifs = db.prets.filter((p) => p.statut === 'en_cours').length;
    const revenuTotal = db.paiements.filter((p) => p.statut === 'reussi').reduce((s, p) => s + p.montant, 0);
    const demandesEnAttente =
      db.prets.filter((p) => p.statut === 'en_attente').length +
      db.indemnites.filter((i) => i.statut === 'en_attente').length +
      db.bonsCommande.filter((b) => b.statut === 'en_attente').length;
    const conventionsActives = db.conventions.filter((c) => c.statut === 'active').length;
    const fournisseursActifs = db.fournisseurs.filter((f) => f.status === 'actif').length;
    return delay({
      totalAdherents, pretsActifs, revenuTotal, demandesEnAttente,
      conventionsActives, fournisseursActifs,
      trendAdherents: 12.4, trendRevenu: 8.7, trendPrets: -3.1, trendDemandes: 5.6,
    });
  },

  monthlyRevenue: async (): Promise<MonthlyPoint[]> => {
    const buckets: Record<string, { revenu: number; depenses: number }> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = d.toISOString().slice(0, 7);
      buckets[k] = { revenu: 0, depenses: 0 };
    }
    for (const op of db.historique) {
      const k = op.date.slice(0, 7);
      if (!buckets[k]) continue;
      if (op.montant >= 0) buckets[k].revenu += op.montant;
      else buckets[k].depenses += Math.abs(op.montant);
    }
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    return delay(
      Object.entries(buckets).map(([k, v]) => ({
        month: months[Number(k.slice(5, 7)) - 1],
        revenu: Math.round(v.revenu),
        depenses: Math.round(v.depenses),
      }))
    );
  },

  operationsByType: async (): Promise<OperationsByType[]> => {
    const counts: Record<string, number> = {};
    for (const op of db.historique) {
      counts[op.type] = (counts[op.type] ?? 0) + 1;
    }
    const labels: Record<string, string> = {
      credit: 'Crédit', debit: 'Débit', pret: 'Prêt',
      remboursement: 'Rembours.', cotisation: 'Cotis.',
      indemnite: 'Indemn.', facture: 'Factures',
    };
    return delay(Object.entries(counts).map(([k, v]) => ({ type: labels[k] ?? k, total: v })));
  },

  pretsByStatus: async (): Promise<PretsByStatus[]> => {
    const counts: Record<string, number> = {};
    for (const p of db.prets) counts[p.statut] = (counts[p.statut] ?? 0) + 1;
    const palette: Record<string, { name: string; color: string }> = {
      en_cours:   { name: 'En cours',   color: '#3b82f6' },
      rembourse:  { name: 'Remboursé',  color: '#22c55e' },
      en_retard:  { name: 'En retard',  color: '#ef4444' },
      en_attente: { name: 'En attente', color: '#f59e0b' },
      rejete:     { name: 'Rejeté',     color: '#94a3b8' },
    };
    return delay(
      Object.entries(counts).map(([k, v]) => ({
        name: palette[k]?.name ?? k,
        value: v,
        color: palette[k]?.color ?? '#94a3b8',
      }))
    );
  },

  recentActivity: async () => {
    return delay([...db.historique].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8));
  },

  alerts: async () => {
    const today = Date.now();
    const expiringConventions = db.conventions
      .filter((c) => c.statut === 'active')
      .filter((c) => {
        const d = new Date(c.dateFin).getTime();
        return d - today < 30 * 86400000 && d > today;
      });
    const unpaidFactures = db.factures.filter((f) => f.statut === 'impayee' || f.statut === 'en_retard');
    const latePrets = db.prets.filter((p) => p.statut === 'en_retard');
    return delay({ expiringConventions, unpaidFactures, latePrets });
  },
};
