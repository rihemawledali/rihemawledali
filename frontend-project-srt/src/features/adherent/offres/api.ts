/* ============================================
   Offres API — Adherent Portal
   Tickets restaurant only.
   Conventions are handled by conventionsApi.ts.
   ============================================ */

import { get, post } from '../../../shared/api/apiClient';
import type { TicketAssignment, TicketRestaurant } from '../../../shared/types/domain';

export interface OffresData {
  tickets: TicketRestaurant[];
  ticketAssignments: TicketAssignment[];
}

export const offresApi = {
  async getOffres(): Promise<OffresData> {
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

  async acceptTicketAssignment(id: string): Promise<TicketAssignment> {
    const { data } = await post<TicketAssignment>(
      `/api/adherent/offres/ticket-assignments/${encodeURIComponent(id)}/accept`,
      {},
    );
    return data;
  },

  async rejectTicketAssignment(id: string): Promise<TicketAssignment> {
    const { data } = await post<TicketAssignment>(
      `/api/adherent/offres/ticket-assignments/${encodeURIComponent(id)}/reject`,
      {},
    );
    return data;
  },
};
