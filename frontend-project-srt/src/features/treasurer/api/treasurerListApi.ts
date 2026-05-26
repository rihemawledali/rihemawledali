/* ============================================
   Treasurer — list APIs (backed by /api/treasurer/*)
   --------------------------------------------------
   Page contracts unchanged: each method returns a `PageResult<T>`.
   Pagination
   / search / sort happen client-side on top of the list responses
   delivered by the backend.
   ============================================ */

import { paginate } from '../../../shared/lib/paginate';
import {
  normalizeConventionDemandeStatus,
  type ConventionDemandeDisplayStatus,
} from '../../../shared/lib/conventionWorkflow';
import { get, post, put, del, downloadBlob, triggerBlobDownload } from '../../../shared/api/apiClient';
import type {
  PretSocial, CompteBancaire, PageQuery,
  HistoriqueFinanciere, PaiementMode,
  PretStatus, PretRemboursementStatus,
  HistoriqueSourceType, PaiementStatus,
} from '../../../shared/types/domain';

// =============================================================
// Prêts list
// =============================================================

interface PretDtoBE {
  id: string;
  adherentId: string;
  adherentNom: string;
  montant: number;
  duree: number;
  taux: number;
  statut: PretStatus | string;
  dateDemande: string;
  dateAccord?: string | null;
  motif?: string | null;
  documentNom?: string | null;
  documentSize?: number | null;
  remboursements?: PretRemboursementDtoBE[] | null;
}

interface PretRemboursementDtoBE {
  id: string;
  retenueId?: string | null;
  mois?: number | null;
  annee?: number | null;
  dateRetenue?: string | null;
  montant: number;
  statut: string;
  libelle?: string | null;
}

function mapPret(p: PretDtoBE): PretSocial {
  return {
    id: p.id,
    adherentId: p.adherentId,
    adherentNom: p.adherentNom,
    montant: p.montant,
    duree: p.duree,
    taux: p.taux,
    statut: p.statut as PretStatus,
    dateDemande: p.dateDemande,
    dateAccord: p.dateAccord ?? undefined,
    motif: p.motif ?? undefined,
    documentNom: p.documentNom ?? undefined,
    documentSize: p.documentSize ?? undefined,
    remboursements: (p.remboursements ?? []).map((r) => ({
      id: r.id,
      retenueId: r.retenueId ?? undefined,
      mois: r.mois ?? undefined,
      annee: r.annee ?? undefined,
      dateRetenue: r.dateRetenue ?? undefined,
      montant: r.montant,
      statut: r.statut as PretRemboursementStatus,
      libelle: r.libelle ?? undefined,
    })),
  };
}

export const treasurerPretsApi = {
  list: async (q?: PageQuery) => {
    const { data } = await get<PretDtoBE[]>('/api/treasurer/prets');
    return paginate<PretSocial>(data.map(mapPret), q, ['adherentNom', 'statut']);
  },
  getById: async (id: string): Promise<PretSocial | undefined> => {
    try {
      const { data } = await get<PretDtoBE>(`/api/treasurer/prets/${id}`);
      return mapPret(data);
    } catch {
      return undefined;
    }
  },
  valider: async (id: string): Promise<PretSocial> => {
    const { data } = await put<PretDtoBE>(`/api/treasurer/prets/${id}/valider`, {});
    return mapPret(data);
  },
  rejeter: async (id: string, motif?: string): Promise<PretSocial> => {
    const { data } = await put<PretDtoBE>(
      `/api/treasurer/prets/${id}/rejeter`,
      motif ? { motif } : {},
    );
    return mapPret(data);
  },
  askAi: async (id: string, question?: string): Promise<{ answer: string }> => {
    const { data } = await post<{ answer: string }>(`/api/treasurer/prets/${id}/ask-ai`, {
      question,
    });
    return data;
  },
};

// Retenues mensuelles — master / detail
// =============================================================

export type RetenueLigneType = 'COTISATION' | 'PRET' | 'CONVENTION' | 'TICKET_RESTAURANT';
export type RetenueLigneStatut = 'GENEREE' | 'PRELEVEE' | 'EN_ATTENTE' | 'ANNULEE';
export type RetenueMensuelleStatut = 'GENEREE' | 'EXPORTEE';

export interface RetenueLigne {
  id: string;
  retenueMensuelleId: string;
  typeSource: RetenueLigneType;
  /** ID of the originating cotisation / prêt / conventionDemande. */
  sourceRefId: string;
  motif: string;
  montant: number;
  statut: RetenueLigneStatut;
  commentaire?: string;
  trancheNumero?: number;
  trancheTotal?: number;
}

export interface RetenueMensuelle {
  id: string;
  adherentId: string;
  adherentNom: string;
  adherentMatricule?: string;
  mois: number;
  annee: number;
  totalCotisation: number;
  totalPret: number;
  totalConvention: number;
  totalTicket: number;
  totalRetenu: number;
  statut: RetenueMensuelleStatut;
  dateGeneration: string;
  dateExport?: string;
  observation?: string;
  lignes: RetenueLigne[];
}

export interface RetenueLigneRow extends RetenueLigne {
  adherentId: string;
  adherentNom: string;
  adherentMatricule?: string;
  mois: number;
  annee: number;
  moisKey: string;
  masterStatut: RetenueMensuelleStatut;
}

interface RetenueLigneDtoBE {
  id: string;
  type: 'COTISATION' | 'PRET' | 'CONVENTION' | 'TICKET_RESTAURANT';
  montant: number;
  libelle?: string | null;
  sourceRefId?: string | null;
  statut: string;
}

interface RetenueMensuelleDtoBE {
  id: string;
  adherentId: string;
  adherentNom: string;
  mois: number;
  annee: number;
  totalRetenu: number;
  statut: string;
  dateExport?: string | null;
  lignes: RetenueLigneDtoBE[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const moisKeyOf = (m: number, y: number) => `${y}-${String(m).padStart(2, '0')}`;

function mapLigne(l: RetenueLigneDtoBE, masterId: string): RetenueLigne {
  return {
    id: l.id,
    retenueMensuelleId: masterId,
    typeSource: l.type,
    sourceRefId: l.sourceRefId ?? '',
    motif: l.libelle ?? '',
    montant: l.montant,
    statut: (l.statut as RetenueLigneStatut) ?? 'GENEREE',
  };
}

function mapMaster(r: RetenueMensuelleDtoBE): RetenueMensuelle {
  const lignes = (r.lignes ?? []).map((l) => mapLigne(l, r.id));
  let cot = 0;
  let pret = 0;
  let conv = 0;
  let ticket = 0;
  for (const l of lignes) {
    if (l.statut === 'ANNULEE') continue;
    if (l.typeSource === 'COTISATION') cot += l.montant;
    else if (l.typeSource === 'PRET') pret += l.montant;
    else if (l.typeSource === 'CONVENTION') conv += l.montant;
    else if (l.typeSource === 'TICKET_RESTAURANT') ticket += l.montant;
  }
  return {
    id: r.id,
    adherentId: r.adherentId,
    adherentNom: r.adherentNom,
    mois: r.mois,
    annee: r.annee,
    totalCotisation: round2(cot),
    totalPret: round2(pret),
    totalConvention: round2(conv),
    totalTicket: round2(ticket),
    totalRetenu: r.totalRetenu,
    statut: (r.statut as RetenueMensuelleStatut) ?? 'GENEREE',
    dateGeneration: (r.createdAt ?? '').slice(0, 10),
    dateExport: r.dateExport ? r.dateExport.slice(0, 10) : undefined,
    lignes,
  };
}

export const treasurerRetenuesApi = {
  /** Master rows (aggregated view). Search keys: adhérent, _moisKey, statut. */
  async list(q?: PageQuery) {
    const { data } = await get<RetenueMensuelleDtoBE[]>('/api/treasurer/retenues');
    const rows = data.map(mapMaster);
    type Row = RetenueMensuelle & { _moisKey: string };
    const enriched: Row[] = rows.map((r) => ({ ...r, _moisKey: moisKeyOf(r.mois, r.annee) }));
    const page = await paginate<Row>(enriched, q, ['adherentNom', '_moisKey', 'statut']);
    return {
      ...page,
      items: page.items.map((row) => {
        const { _moisKey, ...rest } = row;
        void _moisKey;
        return rest as RetenueMensuelle;
      }),
    };
  },

  /** Flat (legacy) view: every line as its own row, enriched with master meta. */
  async listFlat(q?: PageQuery) {
    const { data } = await get<RetenueMensuelleDtoBE[]>('/api/treasurer/retenues');
    const rows: RetenueLigneRow[] = data.flatMap((r) => {
      const master = mapMaster(r);
      return master.lignes.map((l) => ({
        ...l,
        adherentId: master.adherentId,
        adherentNom: master.adherentNom,
        adherentMatricule: master.adherentMatricule,
        mois: master.mois,
        annee: master.annee,
        moisKey: moisKeyOf(master.mois, master.annee),
        masterStatut: master.statut,
      }));
    });
    return paginate<RetenueLigneRow>(rows, q, ['adherentNom', 'motif', 'moisKey', 'statut', 'typeSource']);
  },

  async getById(id: string): Promise<RetenueMensuelle | null> {
    try {
      const { data } = await get<RetenueMensuelleDtoBE>(`/api/treasurer/retenues/${id}`);
      return mapMaster(data);
    } catch {
      return null;
    }
  },

  async historyForAdherent(adherentId: string): Promise<RetenueMensuelle[]> {
    const { data } = await get<RetenueMensuelleDtoBE[]>(`/api/treasurer/retenues/history/${adherentId}`);
    return data.map(mapMaster);
  },

  /** Idempotent generation. With no args, generates the current month. */
  async generate(opts?: { mois?: number; annee?: number }): Promise<{
    count: number;
    mois: number;
    annee: number;
    created: number;
    updated: number;
  }> {
    const now = new Date();
    const mois = opts?.mois ?? now.getMonth() + 1;
    const annee = opts?.annee ?? now.getFullYear();
    const { data } = await post<RetenueMensuelleDtoBE[]>('/api/treasurer/retenues/generate', {
      mois,
      annee,
    });
    // The backend returns the full upserted set; we don't distinguish
    // created vs updated from the response, so the toast can use the count only.
    return { count: data.length, mois, annee, created: data.length, updated: 0 };
  },

  /**
   * Move the master to a new statut. The backend allows step-by-step
   * forward AND backward transitions, so the `force` flag is honoured
   * implicitly: we just pass through whatever the page asks for.
   */
  async setStatut(
    id: string,
    next: RetenueMensuelleStatut,
    observation?: string,
    _force = false,
  ): Promise<RetenueMensuelle> {
    void observation;
    void _force;
    const { data } = await put<RetenueMensuelleDtoBE>(`/api/treasurer/retenues/${id}/statut`, {
      statut: next,
    });
    return mapMaster(data);
  },

  async setLigneStatut(
    retenueId: string,
    ligneId: string,
    statut: RetenueLigneStatut,
    _commentaire?: string,
  ): Promise<RetenueMensuelle> {
    void _commentaire;
    const { data } = await put<RetenueMensuelleDtoBE>(
      `/api/treasurer/retenues/${retenueId}/lignes/${ligneId}/statut`,
      { statut },
    );
    return mapMaster(data);
  },

  /**
   * Force-recompute a single master's lignes (resets EXPORTEE → GENEREE
   * if needed). Used when an adhésion was activated after the master had
   * already been created/exported and the cotisation line is missing.
   */
  async regenerate(id: string): Promise<RetenueMensuelle> {
    const { data } = await post<RetenueMensuelleDtoBE>(`/api/treasurer/retenues/${id}/regenerate`, {});
    return mapMaster(data);
  },

  /**
   * Export one retenue to CSV and trigger a browser download. Also advances
   * the master to EXPORTEE server-side (idempotent on subsequent calls).
   */
  async exportOne(id: string): Promise<{ filename: string }> {
    const { blob, filename } = await downloadBlob(`/api/treasurer/retenues/${id}/export`, {
      method: 'POST',
    });
    triggerBlobDownload(blob, filename);
    return { filename };
  },

  /**
   * Export every retenue for the given (mois, annee) period as one CSV.
   * Any master still in GENEREE is flipped to EXPORTEE by the server.
   */
  async exportPeriod(mois: number, annee: number): Promise<{ filename: string }> {
    const qs = `mois=${mois}&annee=${annee}`;
    const { blob, filename } = await downloadBlob(
      `/api/treasurer/retenues/export?${qs}`,
      { method: 'POST' },
    );
    triggerBlobDownload(blob, filename);
    return { filename };
  },

  /** Reference for the demande snapshot (used by the adhérent UI). */
  trancheInfoForDemande(): { offre: number; total: number; mensualite: number } | null {
    // Convention tranches are not modeled in the backend yet — return null
    // so the calling UI hides the tranche-specific block.
    return null;
  },
};

// =============================================================
// Trésorerie snapshot
// =============================================================

export interface TresorerieSnapshot {
  comptes: CompteBancaire[];
  totalSolde: number;
  encaissementsMois: number;
  decaissementsMois: number;
  derniereOperation?: string;
}

interface CompteBancaireDtoBE {
  id: string;
  banque: string;
  iban: string;
  solde: number;
  devise: 'TND' | 'EUR' | 'USD';
}

interface HistoriqueTresorerieDtoBE {
  id: string;
  type: 'entree' | 'sortie';
  sourceType?: HistoriqueSourceType | null;
  sourceRefId?: string | null;
  description?: string | null;
  montant: number;
  date: string;
  reference?: string | null;
  modePaiement?: PaiementMode | null;
  statut?: PaiementStatus | null;
  utilisateur?: string | null;
  typeOperation?: string | null;
  compteBancaireId?: string | null;
  compteBancaireBanque?: string | null;
}

function mapHistorique(h: HistoriqueTresorerieDtoBE): HistoriqueFinanciere {
  return {
    id: h.id,
    type: h.type,
    sourceType: h.sourceType ?? undefined,
    sourceRefId: h.sourceRefId ?? undefined,
    description: h.description ?? '',
    montant: h.montant,
    date: h.date,
    reference: h.reference ?? undefined,
    modePaiement: h.modePaiement ?? undefined,
    statut: h.statut ?? undefined,
    utilisateur: h.utilisateur ?? undefined,
    typeOperation: h.typeOperation ?? undefined,
    compteBancaireId: h.compteBancaireId ?? undefined,
    compteBancaireBanque: h.compteBancaireBanque ?? undefined,
  };
}

export const treasurerTresorerieApi = {
  async snapshot(): Promise<TresorerieSnapshot> {
    const [comptesRes, histRes] = await Promise.all([
      get<CompteBancaireDtoBE[]>('/api/treasurer/comptes'),
      get<HistoriqueTresorerieDtoBE[]>('/api/treasurer/historique'),
    ]);
    const comptes: CompteBancaire[] = comptesRes.data.map((c) => ({
      id: c.id,
      banque: c.banque,
      iban: c.iban,
      solde: c.solde,
      devise: c.devise,
    }));
    const totalSolde = comptes.reduce((s, c) => s + c.solde, 0);

    const monthKey = new Date().toISOString().slice(0, 7);
    const monthOps = histRes.data
      .map(mapHistorique)
      .filter((o) => o.date.slice(0, 7) === monthKey);
    const encaissementsMois = monthOps
      .filter((o) => o.montant > 0)
      .reduce((s, o) => s + o.montant, 0);
    const decaissementsMois = Math.abs(
      monthOps.filter((o) => o.montant < 0).reduce((s, o) => s + o.montant, 0),
    );
    const derniereOperation = histRes.data.length > 0 ? histRes.data[0].date : undefined;

    return {
      comptes,
      totalSolde,
      encaissementsMois,
      decaissementsMois,
      derniereOperation,
    };
  },

  /** List comptes only (no historique). */
  async listComptes(): Promise<CompteBancaire[]> {
    const res = await get<CompteBancaireDtoBE[]>('/api/treasurer/comptes');
    return res.data.map((c) => ({
      id: c.id,
      banque: c.banque,
      iban: c.iban,
      solde: c.solde,
      devise: c.devise,
    }));
  },

  async createCompte(payload: Omit<CompteBancaire, 'id'>): Promise<CompteBancaire> {
    const res = await post<CompteBancaireDtoBE>('/api/treasurer/comptes', {
      banque: payload.banque,
      iban: payload.iban.trim(),
      solde: payload.solde,
      devise: payload.devise,
    });
    const c = res.data;
    return { id: c.id, banque: c.banque, iban: c.iban, solde: c.solde, devise: c.devise };
  },

  async updateCompte(id: string, payload: Partial<Omit<CompteBancaire, 'id'>>): Promise<CompteBancaire> {
    const body: Record<string, unknown> = {};
    if (payload.banque !== undefined) body.banque = payload.banque;
    if (payload.iban !== undefined) body.iban = payload.iban.trim();
    if (payload.solde !== undefined) body.solde = payload.solde;
    if (payload.devise !== undefined) body.devise = payload.devise;
    const res = await put<CompteBancaireDtoBE>(`/api/treasurer/comptes/${id}`, body);
    const c = res.data;
    return { id: c.id, banque: c.banque, iban: c.iban, solde: c.solde, devise: c.devise };
  },

  async deleteCompte(id: string): Promise<void> {
    await del(`/api/treasurer/comptes/${id}`);
  },

  /** Manual deposit (versement) into a specific bank account. */
  async deposerManuellement(
    compteId: string,
    payload: { montant: number; description?: string },
  ): Promise<HistoriqueFinanciere> {
    const { data } = await post<HistoriqueTresorerieDtoBE>(
      `/api/treasurer/comptes/${compteId}/depot`,
      payload,
    );
    return mapHistorique(data);
  },
};

// =============================================================
// Convention demandes — treasurer workflow
// =============================================================

export type ConventionDemandeStatutBE =
  | 'en_attente'
  | 'validee'
  | 'refusee'
  | 'annulee'
  | 'SOUMISE'
  | 'APPROUVEE'
  | 'EN_COURS'
  | 'JUSTIFIEE'
  | 'VALIDEE'
  | 'FACTUREE'
  | 'PAYEE'
  | 'REFUSEE'
  | 'ANNULEE';

export interface ConventionDemandeSnapshot {
  fournisseurNom?: string | null;
  type?: string | null;
  remise?: number | null;
  dateDebut?: string | null;
  dateFin?: string | null;
  avantage?: string | null;
}

export interface ConventionDemandeRow {
  id: string;
  conventionId: string;
  adherentId: string;
  adherentNom: string;
  dateDemande: string;
  statut: ConventionDemandeStatutBE;
  statutNormalise: ConventionDemandeDisplayStatus;
  dateDecision?: string;
  motifRefus?: string;
  commentaire?: string;
  documentNom?: string;
  attachmentId?: string;
  typeAvantage?: string;
  montantAvantage?: number;
  pourcentageAdherent?: number;
  nombreMoisRetenue?: number;
  factureId?: string;
  factureNumero?: string;
  factureMois?: number;
  factureAnnee?: number;
  montantTotal?: number;
  montantAdherent?: number;
  montantAmicale?: number;
  retenueMoisDebut?: number;
  retenueAnneeDebut?: number;
  retenueNombreMois?: number;
  retenueMontantMensuel?: number;
  conventionSnapshot?: ConventionDemandeSnapshot;
}

interface ConventionDemandeDtoBE {
  id: string;
  conventionId: string;
  adherentId: string;
  adherentNom: string;
  dateDemande: string;
  statut: string;
  dateDecision?: string | null;
  motifRefus?: string | null;
  commentaire?: string | null;
  documentNom?: string | null;
  attachmentId?: string | null;
  typeAvantage?: string | null;
  montantAvantage?: number | null;
  pourcentageAdherent?: number | null;
  nombreMoisRetenue?: number | null;
  factureId?: string | null;
  factureNumero?: string | null;
  factureMois?: number | null;
  factureAnnee?: number | null;
  montantTotal?: number | null;
  montantAdherent?: number | null;
  montantAmicale?: number | null;
  retenueMoisDebut?: number | null;
  retenueAnneeDebut?: number | null;
  retenueNombreMois?: number | null;
  retenueMontantMensuel?: number | null;
  conventionSnapshot?: ConventionDemandeSnapshot | null;
}

function mapConventionDemande(d: ConventionDemandeDtoBE): ConventionDemandeRow {
  return {
    id: d.id,
    conventionId: d.conventionId,
    adherentId: d.adherentId,
    adherentNom: d.adherentNom,
    dateDemande: d.dateDemande,
    statut: (d.statut as ConventionDemandeStatutBE) ?? 'en_attente',
    statutNormalise: normalizeConventionDemandeStatus(d.statut),
    dateDecision: d.dateDecision ?? undefined,
    motifRefus: d.motifRefus ?? undefined,
    commentaire: d.commentaire ?? undefined,
    documentNom: d.documentNom ?? undefined,
    attachmentId: d.attachmentId ?? undefined,
    typeAvantage: d.typeAvantage ?? undefined,
    montantAvantage: d.montantAvantage ?? undefined,
    pourcentageAdherent: d.pourcentageAdherent ?? undefined,
    nombreMoisRetenue: d.nombreMoisRetenue ?? undefined,
    factureId: d.factureId ?? undefined,
    factureNumero: d.factureNumero ?? undefined,
    factureMois: d.factureMois ?? undefined,
    factureAnnee: d.factureAnnee ?? undefined,
    montantTotal: d.montantTotal ?? undefined,
    montantAdherent: d.montantAdherent ?? undefined,
    montantAmicale: d.montantAmicale ?? undefined,
    retenueMoisDebut: d.retenueMoisDebut ?? undefined,
    retenueAnneeDebut: d.retenueAnneeDebut ?? undefined,
    retenueNombreMois: d.retenueNombreMois ?? undefined,
    retenueMontantMensuel: d.retenueMontantMensuel ?? undefined,
    conventionSnapshot: d.conventionSnapshot ?? undefined,
  };
}

export const treasurerConventionsApi = {
  list: async (q?: PageQuery) => {
    const { data } = await get<ConventionDemandeDtoBE[]>('/api/treasurer/conventions/demandes');
    return paginate<ConventionDemandeRow>(
      data.map(mapConventionDemande),
      q,
      ['adherentNom', 'statut', 'commentaire'],
    );
  },

  getById: async (id: string): Promise<ConventionDemandeRow | undefined> => {
    try {
      const { data } = await get<ConventionDemandeDtoBE>(`/api/treasurer/conventions/demandes/${id}`);
      return mapConventionDemande(data);
    } catch {
      return undefined;
    }
  },

  valider: async (id: string): Promise<ConventionDemandeRow> => {
    const { data } = await put<ConventionDemandeDtoBE>(
      `/api/treasurer/conventions/demandes/${id}/valider`,
      {},
    );
    return mapConventionDemande(data);
  },

  refuser: async (id: string, motif?: string): Promise<ConventionDemandeRow> => {
    const { data } = await put<ConventionDemandeDtoBE>(
      `/api/treasurer/conventions/demandes/${id}/refuser`,
      motif ? { motif } : {},
    );
    return mapConventionDemande(data);
  },
};
