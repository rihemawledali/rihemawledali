/* ============================================
   Offres API — Adherent Portal
   Bons de commande + tickets restaurant.
   Conventions are handled by conventionsApi.ts.
   ============================================ */

import { get, post } from '../../../lib/apiClient';
import type { BonCommande, TicketRestaurant } from '../../../types/domain';
import { mockBonsCommande, mockTicketsRestaurant, delay } from './mockData';

const USE_MOCKS = true;

export interface OffresData {
  bons: BonCommande[];
  tickets: TicketRestaurant[];
}

export const offresApi = {
  async getOffres(): Promise<OffresData> {
    if (USE_MOCKS) {
      return delay({ bons: mockBonsCommande, tickets: mockTicketsRestaurant }, 400);
    }
    const { data } = await get<OffresData>('/api/adherent/offres');
    return data;
  },

  async requestBon(bonId: string): Promise<void> {
    if (USE_MOCKS) {
      return delay(undefined, 500);
    }
    await post(`/api/adherent/offres/bons/${bonId}/request`, {});
  },

  async requestTicket(ticketId: string): Promise<void> {
    if (USE_MOCKS) {
      return delay(undefined, 500);
    }
    await post(`/api/adherent/offres/tickets/${ticketId}/request`, {});
  },
};
