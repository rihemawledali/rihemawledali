import type { Adherent, Adhesion, PretSocial } from '../../../shared/types/domain';

export interface DashboardData {
  profile: Adherent;
  adhesion: Adhesion | null;
  activeLoan: PretSocial | null;
  pendingIndemnities: number;
  availableOffers: number;
}

export interface ConventionStats {
  active: number;
  pending: number;
  available: number;
}
