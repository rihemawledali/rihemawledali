/* ============================================
   Offres API — Adherent Portal
   Tickets restaurant only.
   Conventions are handled by conventionsApi.ts.
   ============================================ */

import { get, post } from '../../../lib/apiClient';
import type { TicketRestaurant } from '../../../types/domain';
import { mockTicketsRestaurant, delay } from './mockData';

const USE_MOCKS = false;

export interface OffresData {
  tickets: TicketRestaurant[];
}

export const offresApi = {
  async getOffres(): Promise<OffresData> {
    if (USE_MOCKS) {
      return delay({ tickets: mockTicketsRestaurant }, 400);
    }
    const { data } = await get<OffresData>('/api/adherent/offres');
    return data;
  },

  async acceptTicket(id: string): Promise<TicketRestaurant> {
    const { data } = await post<TicketRestaurant>(`/api/adherent/offres/tickets/${id}/accept`, {});
    return data;
  },

  async rejectTicket(id: string): Promise<TicketRestaurant> {
    const { data } = await post<TicketRestaurant>(`/api/adherent/offres/tickets/${id}/reject`, {});
    return data;
  },
};
