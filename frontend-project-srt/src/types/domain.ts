/* ============================================
   Domain Types — SRT Management System
   ============================================ */

export type UserRole = 'admin' | 'treasurer' | 'manager' | 'adherent';
export type UserStatus = 'actif' | 'inactif' | 'suspendu';

export interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: UserRole;
  status: UserStatus;
  matricule?: string;
  createdAt: string;
}

export interface Adherent extends Utilisateur {
  salaire: number;
  enfants: number;
  marie: boolean;
}

export type PretStatus = 'en_cours' | 'rembourse' | 'en_retard' | 'en_attente' | 'rejete';
export interface PretSocial {
  id: string;
  adherentId: string;
  adherentNom: string;
  montant: number;
  duree: number; // mois
  taux: number;  // %
  statut: PretStatus;
  dateDemande: string;
  dateAccord?: string;
}

export type AdhesionStatus = 'active' | 'expiree' | 'suspendue';
export interface Adhesion {
  id: string;
  adherentId: string;
  dateDebut: string;
  dateFin: string;
  montantCotisation: number;
  statut: AdhesionStatus;
}

export type IndemniteType = 'maladie' | 'naissance' | 'mariage' | 'deces' | 'scolarite';
export type IndemniteStatus = 'en_attente' | 'approuvee' | 'rejetee' | 'payee';
export interface Indemnite {
  id: string;
  adherentId: string;
  adherentNom: string;
  type: IndemniteType;
  montant: number;
  statut: IndemniteStatus;
  dateDemande: string;
}

export type BonStatus = 'en_attente' | 'attribue' | 'utilise' | 'expire';
export interface BonCommande {
  id: string;
  numero: string;
  adherentId?: string;
  adherentNom?: string;
  fournisseurId: string;
  fournisseurNom: string;
  montant: number;
  statut: BonStatus;
  dateEmission: string;
  dateExpiration: string;
}

export type TicketType = 'restaurant' | 'cafeteria';
export interface TicketRestaurant {
  id: string;
  numero: string;
  typeBon: TicketType;
  montant: number;
  statut: BonStatus;
  adherentId?: string;
  adherentNom?: string;
  dateEmission: string;
}

export type ConventionType = 'sante' | 'restauration' | 'transport' | 'loisir' | 'commerce' | 'education';
export type ConventionStatus = 'active' | 'expiree' | 'en_negociation' | 'suspendue';
export interface Convention {
  id: string;
  fournisseurId: string;
  fournisseurNom: string;
  type: ConventionType;
  dateDebut: string;
  dateFin: string;
  remise: number; // %
  statut: ConventionStatus;
  description?: string;
  descriptionCourte?: string;
  avantage?: string;
  conditions?: string;
  conditionsList?: string[];
  documentsRequis?: string[];
  fournisseurAdresse?: string;
  fournisseurTelephone?: string;
  fournisseurEmail?: string;
  fournisseurContact?: string;
  /** True when the current adherent has joined the convention (UI only) */
  joined?: boolean;
}

/**
 * Status surfaced to the adherent when browsing conventions.
 * - disponible      : can request to join
 * - deja_demandee   : a request is pending
 * - active          : request validated, currently benefiting
 * - expiree         : validity period passed
 * - non_disponible  : suspended / under negotiation / unavailable
 */
export type ConventionAdherentStatus =
  | 'disponible'
  | 'deja_demandee'
  | 'active'
  | 'expiree'
  | 'non_disponible';

export type ConventionDemandeStatut = 'en_attente' | 'validee' | 'refusee' | 'annulee';

export interface ConventionDemande {
  id: string;
  conventionId: string;
  adherentId: string;
  adherentNom: string;
  dateDemande: string;
  statut: ConventionDemandeStatut;
  dateDecision?: string;
  motifRefus?: string;
  commentaire?: string;
  documentNom?: string;
  /** Cached snapshot of the convention at request time (for history rendering) */
  conventionSnapshot?: Pick<
    Convention,
    'fournisseurNom' | 'type' | 'remise' | 'dateDebut' | 'dateFin' | 'avantage'
  >;
}

export interface Fournisseur {
  id: string;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  categorie: ConventionType;
  status: 'actif' | 'inactif';
  createdAt: string;
}

export type FactureStatus = 'payee' | 'impayee' | 'en_retard' | 'partielle';
export interface Facture {
  id: string;
  numero: string;
  fournisseurId: string;
  fournisseurNom: string;
  montant: number;
  statut: FactureStatus;
  dateEmission: string;
  dateEcheance: string;
}

export type PaiementMode = 'virement' | 'cheque' | 'especes' | 'carte';
export type PaiementStatus = 'reussi' | 'en_attente' | 'echoue' | 'rembourse';
export interface Paiement {
  id: string;
  reference: string;
  factureId?: string;
  factureNumero?: string;
  beneficiaire: string;
  montant: number;
  mode: PaiementMode;
  statut: PaiementStatus;
  date: string;
}

export interface CompteBancaire {
  id: string;
  banque: string;
  iban: string;
  solde: number;
  devise: 'TND' | 'EUR' | 'USD';
}

export type OperationType = 'credit' | 'debit' | 'pret' | 'remboursement' | 'cotisation' | 'indemnite' | 'facture';
export interface HistoriqueFinanciere {
  id: string;
  type: OperationType;
  description: string;
  montant: number;
  date: string;
  reference?: string;
  utilisateur?: string;
}

export interface PageQuery {
  page?: number;
  size?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  filters?: Record<string, string | undefined>;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
