import { db } from '../../../mocks/db';

const delay = <T,>(value: T, ms = 200) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

export interface DashboardStats {
  totalAdherents: number;
  pretsActifs: number;
  revenuTotal: number;
  demandesEnAttente: number;
  fournisseursActifs: number;
  trendAdherents: number;
  trendRevenu: number;
  trendPrets: number;
  trendDemandes: number;
}

export const dashboardApi = {
  stats: async (): Promise<DashboardStats> => {
    const totalAdherents = db.adherents.length;
    const pretsActifs = db.prets.filter((pret) => pret.statut === 'en_cours').length;
    const revenuTotal = db.paiements
      .filter((paiement) => paiement.statut === 'reussi')
      .reduce((sum, paiement) => sum + paiement.montant, 0);
    const demandesEnAttente =
      db.prets.filter((pret) => pret.statut === 'en_attente').length +
      db.indemnites.filter((indemnite) => indemnite.statut === 'en_attente').length +
      db.bonsCommande.filter((bonCommande) => bonCommande.statut === 'en_attente').length;
    const fournisseursActifs = db.fournisseurs.filter((fournisseur) => fournisseur.status === 'actif').length;

    return delay({
      totalAdherents,
      pretsActifs,
      revenuTotal,
      demandesEnAttente,
      fournisseursActifs,
      trendAdherents: 12.4,
      trendRevenu: 8.7,
      trendPrets: -3.1,
      trendDemandes: 5.6,
    });
  },
};
