import type { BonCommande, TicketRestaurant, PageQuery } from '../../types/domain';
import { db } from '../../mocks/db';
import { paginate, createRow, updateRow, removeRow } from '../../mocks/api';

export const bonsCommandeApi = {
  list: (q?: PageQuery) => paginate<BonCommande>(db.bonsCommande, q, ['numero', 'fournisseurNom', 'adherentNom']),
  create: (data: Omit<BonCommande, 'id'>) => createRow<BonCommande>(db.bonsCommande, data, 'bc'),
  update: (id: string, patch: Partial<BonCommande>) => updateRow(db.bonsCommande, id, patch),
  remove: (id: string) => removeRow(db.bonsCommande, id),
};

export const ticketsApi = {
  list: (q?: PageQuery) => paginate<TicketRestaurant>(db.ticketsRestaurant, q, ['numero', 'adherentNom']),
  create: (data: Omit<TicketRestaurant, 'id'>) => createRow<TicketRestaurant>(db.ticketsRestaurant, data, 'tr'),
  update: (id: string, patch: Partial<TicketRestaurant>) => updateRow(db.ticketsRestaurant, id, patch),
  remove: (id: string) => removeRow(db.ticketsRestaurant, id),
};
