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
  /** ISO yyyy-MM-dd, populated by the backend AdherentProfileDto. */
  dateNaissance?: string;
}

export type PretStatus = 'en_cours' | 'rembourse' | 'en_retard' | 'en_attente' | 'rejete';
export type PretRemboursementStatus = 'GENEREE' | 'PRELEVEE' | 'EN_ATTENTE' | 'ANNULEE';

export interface PretRemboursement {
  id: string;
  retenueId?: string;
  mois?: number;
  annee?: number;
  dateRetenue?: string;
  montant: number;
  statut: PretRemboursementStatus;
  libelle?: string;
}

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
  /** Free-text reason given by the adherent. */
  motif?: string;
  /** Name of the supporting document uploaded by the adherent. */
  documentNom?: string;
  /** Size in bytes of the supporting document. */
  documentSize?: number;
  /** Real repayment lines generated from retenues_lignes. */
  remboursements?: PretRemboursement[];
}

export type AdhesionStatus = 'en_attente' | 'active' | 'rejetee' | 'expiree' | 'suspendue';
export interface Adhesion {
  id: string;
  adherentId: string;
  dateDebut: string;
  dateFin: string;
  montantCotisation: number;
  statut: AdhesionStatus;
}

export type IndemniteType = 'maladie' | 'naissance' | 'mariage' | 'deces' | 'scolarite';
/**
 * Indemnité workflow:
 *   en_attente → approuvee (alias: validee) → payee
 *   en_attente → rejetee
 *   en_attente | approuvee → annulee
 * `validee` is the spec wording; `approuvee` is the legacy literal — both
 * mean the same state and are accepted by all helpers.
 */
export type IndemniteStatus = 'en_attente' | 'approuvee' | 'validee' | 'rejetee' | 'payee' | 'annulee';
export interface Indemnite {
  id: string;
  adherentId: string;
  adherentNom: string;
  type: IndemniteType;
  montant: number;
  statut: IndemniteStatus;
  dateDemande: string;
  /** Free-text justification given by the adherent. */
  motif?: string;
  /** Name of the supporting document uploaded by the adherent. */
  documentNom?: string;
  /** Size in bytes of the supporting document. */
  documentSize?: number;
}

export type BonStatus =
  | 'en_attente'
  | 'attribue'
  | 'utilise'
  | 'expire'
  | 'brouillon'
  | 'valide'
  | 'epuise';

export type TicketType = 'restaurant' | 'cafeteria';

export interface BonCommande {
  id: string;
  numero: string;
  /** Legacy direct assignment fields. New ticket stock orders normally leave these empty. */
  adherentId?: string;
  adherentNom?: string;
  fournisseurId: string;
  fournisseurNom: string;
  typeBon?: TicketType;
  montant: number;
  valeurUnitaire?: number;
  quantiteTotale?: number;
  quantiteRestante?: number;
  quantiteAttribuee?: number;
  statut: BonStatus;
  dateEmission: string;
  dateExpiration: string;
}

export interface BonCommandeDetail {
  bon: BonCommande;
  tickets: TicketRestaurant[];
}

export interface TicketRestaurant {
  id: string;
  numero: string;
  typeBon: TicketType;
  montant: number;
  statut: BonStatus;
  adherentId?: string;
  adherentNom?: string;
  adherentMatricule?: string;
  bonCommandeId?: string;
  bonCommandeNumero?: string;
  dateEmission: string;
  dateAttribution?: string;
  dateDecision?: string;
}

export interface TicketAssignPayload {
  bonCommandeId: string;
  adherentId: string;
  quantite: number;
}

export type ConventionType = 'sante' | 'restauration' | 'transport' | 'loisir' | 'commerce' | 'education';
export type ConventionStatus = 'active' | 'expiree' | 'en_negociation' | 'suspendue';

/**
 * Mode d'avantage applied by a Convention.
 * - REMISE_POURCENTAGE  : discount expressed as a % (`tauxReduction`)
 * - REMISE_MONTANT_FIXE : fixed-amount discount (`montantReduction`)
 */
export type ModeAvantage =
  | 'REMISE_POURCENTAGE'
  | 'REMISE_MONTANT_FIXE';

export interface Convention {
  id: string;
  fournisseurId: string;
  fournisseurNom: string;
  type: ConventionType;
  dateDebut: string;
  dateFin: string;
  /**
   * Legacy global discount (%). The DB column is now nullable but the API
   * coalesces `null → 0` so consumers can treat this as a number.
   * The real benefit is described by `modeAvantage` + `tauxReduction` /
   * `montantReduction`.
   */
  remise: number;
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
  /** Optional cover image / logo URL for the convention */
  imageUrl?: string;
  /** Optional supplier logo URL (small, square) */
  logoUrl?: string;
  /** True when the current adherent has joined the convention (UI only) */
  joined?: boolean;

  /**
   * Total price of the financed offer (in TND).
   * If both `montantOffre` and `nbTranches` are set, every validated
   * `ConventionDemande` generates monthly retenue lines of
   * `montantOffre / nbTranches` until `tranchesPayees === nbTranches`.
   * Conventions with only a `remise` (% discount) leave these unset.
   */
  montantOffre?: number;
  /** Fixed number of monthly tranches the offer is split into. */
  nbTranches?: number;

  // ----- Mode d'avantage -----
  /** Free-text sub-type (e.g. partenariat, cadre, offre ponctuelle). */
  typeConvention?: string;
  /** Mode d'avantage enum value (see {@link ModeAvantage}). */
  modeAvantage?: ModeAvantage;
  /** Discount percentage when {@link modeAvantage} is `REMISE_POURCENTAGE`. */
  tauxReduction?: number;
  /** Fixed amount when {@link modeAvantage} is `REMISE_MONTANT_FIXE` or `SUBVENTION_AMICALE`. */
  montantReduction?: number;
  /** Free-text advantage description (required for `PRIX_NEGOCIE` / `AUTRE`). */
  descriptionAvantage?: string;
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

  /**
   * Number of monthly tranches already deducted via retenue mensuelle.
   * Incremented by `treasurerRetenuesApi.generate(...)` each month a line is emitted.
   * Only meaningful when the related Convention has `montantOffre` + `nbTranches`.
   */
  tranchesPayees?: number;
  /** Snapshot of `Convention.montantOffre` taken at validation time. */
  montantOffreSnapshot?: number;
  /** Snapshot of `Convention.nbTranches` taken at validation time. */
  nbTranchesSnapshot?: number;
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

/**
 * Facture statuses:
 * - `brouillon` — created but not yet emitted
 * - `non_payee` — emitted, awaiting payment (replaces legacy `impayee`,
 *   which is kept as an accepted alias)
 * - `partielle`, `en_retard` — legacy intermediates
 * - `payee` — fully paid
 * - `annulee` — cancelled
 */
export type FactureStatus =
  | 'brouillon'
  | 'non_payee'
  | 'impayee'
  | 'partielle'
  | 'en_retard'
  | 'payee'
  | 'annulee';
export interface Facture {
  id: string;
  numero: string;
  fournisseurId: string;
  fournisseurNom: string;
  montant: number;
  statut: FactureStatus;
  /** Date of issuance (legacy field kept). */
  dateEmission: string;
  dateEcheance: string;
  /** Spec field — alias of `dateEmission` when omitted. */
  dateFacture?: string;
  description?: string;
}

export type PaiementMode = 'virement' | 'cheque' | 'especes' | 'carte';
export type PaiementStatus = 'reussi' | 'en_attente' | 'echoue' | 'rembourse';

/** Type of payment — drives which beneficiary slot is used. */
export type TypePaiement =
  | 'PAIEMENT_FACTURE_FOURNISSEUR'
  | 'PAIEMENT_INDEMNITE'
  | 'AUTRE_SORTIE';

export type BeneficiaireType = 'FOURNISSEUR' | 'ADHERENT' | 'AUTRE';

export interface Paiement {
  id: string;
  reference: string;

  /** Spec — type of payment. Defaults to `PAIEMENT_FACTURE_FOURNISSEUR` for legacy rows linked to a facture. */
  typePaiement?: TypePaiement;
  /** Spec — beneficiary kind. */
  beneficiaireType?: BeneficiaireType;
  /** Optional ID of the beneficiary (fournisseurId or adherentId). */
  beneficiaireId?: string;

  /** Linked facture (only for fournisseur payments). */
  factureId?: string;
  factureNumero?: string;
  /** Linked indemnité (only for indemnité payments). */
  indemniteId?: string;
  /** Free-text description (e.g. "Avance de frais", "Régul. caisse"). */
  description?: string;

  /** Display name of the beneficiary (resolved at creation time). */
  beneficiaire: string;
  montant: number;
  mode: PaiementMode;
  statut: PaiementStatus;
  date: string;
  compteBancaireId?: string;
  compteBancaireBanque?: string;
}

export interface CompteBancaire {
  id: string;
  banque: string;
  iban: string;
  solde: number;
  devise: 'TND' | 'EUR' | 'USD';
}

/**
 * Legacy operation types are kept for backward compatibility.
 * New entries should use `entree` / `sortie` together with `sourceType`.
 */
export type OperationType =
  | 'credit'
  | 'debit'
  | 'pret'
  | 'remboursement'
  | 'cotisation'
  | 'indemnite'
  | 'facture'
  | 'entree'
  | 'sortie';

/** Source entity that triggered a historical row. */
export type HistoriqueSourceType = 'FACTURE' | 'INDEMNITE' | 'RETENUE' | 'AUTRE';

export interface HistoriqueFinanciere {
  id: string;
  type: OperationType;
  /** Spec — source entity that produced this row. Optional for legacy rows. */
  sourceType?: HistoriqueSourceType;
  /** Spec — source entity ID (factureId, indemniteId, retenueId…). */
  sourceRefId?: string;
  description: string;
  montant: number;
  date: string;
  reference?: string;
  utilisateur?: string;
  modePaiement?: PaiementMode;
  statut?: PaiementStatus;
  typeOperation?: string;
  compteBancaireId?: string;
  compteBancaireBanque?: string;
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
