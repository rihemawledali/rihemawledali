import type { Paiement, Facture, HistoriqueFinanciere, PageQuery } from '../../types/domain';
import { db } from '../../mocks/db';
import { paginate, createRow, updateRow, removeRow } from '../../mocks/api';

export const paiementsApi = {
  list: (q?: PageQuery) => paginate<Paiement>(db.paiements, q, ['reference', 'beneficiaire', 'factureNumero']),
  create: (data: Omit<Paiement, 'id'>) => createRow<Paiement>(db.paiements, data, 'pa'),
  update: (id: string, patch: Partial<Paiement>) => updateRow(db.paiements, id, patch),
  remove: (id: string) => removeRow(db.paiements, id),
};

export const facturesApi = {
  list: (q?: PageQuery) => paginate<Facture>(db.factures, q, ['numero', 'fournisseurNom']),
  create: (data: Omit<Facture, 'id'>) => createRow<Facture>(db.factures, data, 'fa'),
  update: (id: string, patch: Partial<Facture>) => updateRow(db.factures, id, patch),
  remove: (id: string) => removeRow(db.factures, id),
};

export const historiqueApi = {
  list: (q?: PageQuery) => paginate<HistoriqueFinanciere>(db.historique, q, ['description', 'reference', 'utilisateur']),
};
