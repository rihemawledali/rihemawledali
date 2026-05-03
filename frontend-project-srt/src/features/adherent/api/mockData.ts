/* ============================================
   Mock Data — Adherent Portal
   ============================================ */

import type {
  Adherent, Adhesion, PretSocial, Indemnite, TicketRestaurant,
  HistoriqueFinanciere, Convention, ConventionDemande,
} from '../../../types/domain';

export const mockAdherent: Adherent = {
  id: 'adh-001',
  nom: 'Ben Salah',
  prenom: 'Ahmed',
  email: 'ahmed.bensalah@example.com',
  telephone: '+216 20 123 456',
  role: 'adherent',
  status: 'actif',
  matricule: 'ADH2024001',
  createdAt: '2024-01-15T00:00:00.000Z',
  salaire: 2500,
  enfants: 2,
  marie: true,
};

// Adhésion is renewed monthly: current month period.
const _now = new Date();
const _monthStart = new Date(_now.getFullYear(), _now.getMonth(), 1).toISOString().split('T')[0];
const _monthEnd = new Date(_now.getFullYear(), _now.getMonth() + 1, 0).toISOString().split('T')[0];

export const mockAdhesion: Adhesion = {
  id: 'adh-001',
  adherentId: 'adh-001',
  dateDebut: _monthStart,
  dateFin: _monthEnd,
  montantCotisation: 50,
  statut: 'active',
};

export const mockAdhesionHistory: Adhesion[] = [
  mockAdhesion,
  {
    id: 'adh-000',
    adherentId: 'adh-001',
    dateDebut: '2023-01-15',
    dateFin: '2024-01-14',
    montantCotisation: 45,
    statut: 'expiree',
  },
];

export const mockPrets: PretSocial[] = [
  {
    id: 'pret-001',
    adherentId: 'adh-001',
    adherentNom: 'Ahmed Ben Salah',
    montant: 5000,
    duree: 12,
    taux: 2.5,
    statut: 'en_cours',
    dateDemande: '2024-06-01',
    dateAccord: '2024-06-05',
    motif: 'Travaux d\u2019aménagement du domicile familial.',
    documentNom: 'devis-amenagement.pdf',
    documentSize: 184_320,
  },
  {
    id: 'pret-002',
    adherentId: 'adh-001',
    adherentNom: 'Ahmed Ben Salah',
    montant: 3000,
    duree: 6,
    taux: 2.0,
    statut: 'rembourse',
    dateDemande: '2023-03-10',
    dateAccord: '2023-03-15',
    motif: 'Achat de matériel informatique pour la famille.',
    documentNom: 'facture-pro-forma.pdf',
    documentSize: 96_512,
  },
  {
    id: 'pret-003',
    adherentId: 'adh-001',
    adherentNom: 'Ahmed Ben Salah',
    montant: 2000,
    duree: 3,
    taux: 1.5,
    statut: 'en_attente',
    dateDemande: '2024-12-20',
    motif: 'Frais médicaux imprévus.',
    documentNom: 'ordonnance-clinique.pdf',
    documentSize: 73_216,
  },
];

export const mockIndemnites: Indemnite[] = [
  {
    id: 'ind-001',
    adherentId: 'adh-001',
    adherentNom: 'Ahmed Ben Salah',
    type: 'maladie',
    montant: 200,
    statut: 'approuvee',
    dateDemande: '2024-11-10',
    motif: 'Hospitalisation de 3 jours suite à une intervention chirurgicale.',
    documentNom: 'certificat-medical.pdf',
    documentSize: 142_080,
  },
  {
    id: 'ind-002',
    adherentId: 'adh-001',
    adherentNom: 'Ahmed Ben Salah',
    type: 'naissance',
    montant: 150,
    statut: 'en_attente',
    dateDemande: '2024-12-25',
    motif: 'Naissance de mon deuxième enfant.',
    documentNom: 'acte-naissance.pdf',
    documentSize: 88_064,
  },
];

export const mockConventions: Convention[] = [
  {
    id: 'conv-001',
    fournisseurId: 'four-001',
    fournisseurNom: 'Pharmacie Centrale Béja',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80&auto=format&fit=crop',
    type: 'sante',
    dateDebut: '2025-01-01',
    dateFin: '2026-12-31',
    remise: 15,
    statut: 'active',
    descriptionCourte: 'Remise sur médicaments et parapharmacie',
    description:
      'Cette convention vous permet de bénéficier d\u2019une remise immédiate de 15% sur les médicaments non remboursés et l\u2019ensemble des produits de parapharmacie (cosmétiques, hygiène, compléments alimentaires).',
    avantage: '15% de remise immédiate en caisse',
    conditions: 'Présentation obligatoire de la carte d\u2019adhérent. Non cumulable avec d\u2019autres promotions.',
    conditionsList: [
      'Être un adhérent actif de l\u2019Amicale SRT',
      'Présenter sa carte d\u2019adhérent en caisse',
      'Non cumulable avec d\u2019autres promotions ou remises',
      'Hors médicaments remboursés par la CNAM',
    ],
    documentsRequis: ['Carte d\u2019adhérent'],
    fournisseurAdresse: '15 Avenue Habib Bourguiba, Béja',
    fournisseurTelephone: '+216 78 234 567',
    fournisseurEmail: 'contact@pharmacie-beja.tn',
    fournisseurContact: 'Mme Leila Khelifi',
    joined: true,
  },
  {
    id: 'conv-002',
    fournisseurId: 'four-002',
    fournisseurNom: 'Restaurant Le Médina',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&auto=format&fit=crop',
    type: 'restauration',
    dateDebut: '2025-03-15',
    dateFin: '2026-03-14',
    remise: 20,
    statut: 'active',
    descriptionCourte: 'Menu du midi à tarif réduit',
    description:
      'Profitez d\u2019une réduction de 20% sur le menu du midi du lundi au vendredi, hors jours fériés. Idéal pour vos pauses déjeuner en famille ou entre collègues.',
    avantage: '20% de remise sur le menu du midi',
    conditions: 'Du lundi au vendredi, hors jours fériés. Réservation conseillée. Plafond de 4 couverts par adhérent.',
    conditionsList: [
      'Du lundi au vendredi uniquement, hors jours fériés',
      'Plafond de 4 couverts par adhérent',
      'Réservation conseillée pour les heures de pointe',
      'Présentation de la carte d\u2019adhérent à l\u2019arrivée',
    ],
    fournisseurAdresse: 'Rue de la Kasbah, Béja',
    fournisseurTelephone: '+216 78 765 432',
    fournisseurEmail: 'reservation@lemedina-beja.tn',
  },
  {
    id: 'conv-004',
    fournisseurId: 'four-004',
    fournisseurNom: 'Monoprix Béja',
    imageUrl: 'https://images.unsplash.com/photo-1580554530778-ca36943938b2?w=800&q=80&auto=format&fit=crop',
    type: 'commerce',
    dateDebut: '2025-04-01',
    dateFin: '2025-12-31',
    remise: 5,
    statut: 'active',
    descriptionCourte: 'Remise sur les courses alimentaires',
    description:
      'Remise de 5% sur l\u2019ensemble de vos courses alimentaires (hors produits déjà soldés ou en promotion).',
    avantage: '5% de remise sur les courses',
    conditions: 'Sur présentation de la carte adhérent en caisse. Plafond mensuel de 500 TND par adhérent.',
    conditionsList: [
      'Présentation de la carte d\u2019adhérent en caisse',
      'Plafond mensuel de 500 TND par adhérent',
      'Hors produits soldés ou en promotion',
      'Hors carburant et produits réglementés',
    ],
    fournisseurAdresse: 'Avenue de la République, Béja',
    fournisseurTelephone: '+216 78 862 000',
  },
  {
    id: 'conv-005',
    fournisseurId: 'four-005',
    fournisseurNom: 'École de langues Linguafrance',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80&auto=format&fit=crop',
    type: 'education',
    dateDebut: '2025-09-01',
    dateFin: '2026-06-30',
    remise: 25,
    statut: 'active',
    descriptionCourte: 'Cours de langues à tarif adhérent',
    description:
      'Remise de 25% sur l\u2019ensemble des cours de langues (français, anglais, allemand, espagnol) pour les adhérents et leurs enfants.',
    avantage: '25% de remise sur les cours de langues',
    conditions: 'Inscription annuelle. Justificatif de scolarité demandé pour les enfants.',
    conditionsList: [
      'Inscription annuelle obligatoire',
      'Justificatif de scolarité requis pour les enfants',
      'Test de niveau gratuit avant inscription',
      'Remise applicable sur les frais d\u2019inscription et de scolarité',
    ],
    documentsRequis: ['Carte d\u2019adhérent', 'Justificatif de scolarité (pour les enfants)'],
    fournisseurAdresse: '12 Rue Farhat Hached, Béja',
    fournisseurTelephone: '+216 78 552 200',
    fournisseurEmail: 'inscriptions@linguafrance-beja.tn',
    fournisseurContact: 'M. Karim Trabelsi',
    montantOffre: 480,
    nbTranches: 6,
  },
  {
    id: 'conv-006',
    fournisseurId: 'four-006',
    fournisseurNom: 'Cinéma Le Royal Béja',
    imageUrl: 'https://images.unsplash.com/photo-1489599433464-7e57cd86bdf1?w=800&q=80&auto=format&fit=crop',
    type: 'loisir',
    dateDebut: '2024-06-01',
    dateFin: '2025-05-31',
    remise: 30,
    statut: 'expiree',
    descriptionCourte: 'Tarif réduit sur les places de cinéma',
    description:
      'Place de cinéma à tarif réduit pour les adhérents et leur famille proche.',
    avantage: '30% de remise sur les places de cinéma',
    conditions: 'Du dimanche au jeudi, hors séances 3D et avant-premières.',
    conditionsList: [
      'Du dimanche au jeudi uniquement',
      'Hors séances 3D et IMAX',
      'Hors avant-premières et événements spéciaux',
    ],
    fournisseurAdresse: 'Avenue Habib Bourguiba, Béja',
  },
  {
    id: 'conv-007',
    fournisseurId: 'four-007',
    fournisseurNom: 'Salle de sport FitZone',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80&auto=format&fit=crop',
    type: 'loisir',
    dateDebut: '2025-06-01',
    dateFin: '2026-05-31',
    remise: 35,
    statut: 'active',
    descriptionCourte: 'Abonnement sport à -35%',
    description:
      'Bénéficiez de 35% de remise sur les abonnements annuels de la salle de sport FitZone (musculation, cardio, cours collectifs, sauna).',
    avantage: '35% sur les abonnements annuels',
    conditions: 'Engagement de 12 mois. Frais d\u2019inscription offerts.',
    conditionsList: [
      'Engagement de 12 mois minimum',
      'Frais d\u2019inscription offerts pour les adhérents',
      'Accès à toutes les salles du réseau',
      'Certificat médical de moins de 3 mois requis',
    ],
    documentsRequis: ['Carte d\u2019adhérent', 'Certificat médical d\u2019aptitude sportive'],
    fournisseurAdresse: 'Route de Tunis, Béja',
    fournisseurTelephone: '+216 78 700 100',
    fournisseurEmail: 'contact@fitzone-beja.tn',
    montantOffre: 600,
    nbTranches: 6,
  },
  {
    id: 'conv-008',
    fournisseurId: 'four-008',
    fournisseurNom: 'Clinique Dentaire Sourire+',
    imageUrl: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&q=80&auto=format&fit=crop',
    type: 'sante',
    dateDebut: '2025-05-01',
    dateFin: '2027-04-30',
    remise: 20,
    statut: 'active',
    descriptionCourte: 'Soins dentaires à tarif préférentiel',
    description:
      'Tarif préférentiel de 20% sur l\u2019ensemble des soins dentaires : détartrage, soins, prothèses, orthodontie.',
    avantage: '20% sur tous les soins dentaires',
    conditions: 'Sur rendez-vous. Devis remis avant tout traitement.',
    conditionsList: [
      'Prise de rendez-vous obligatoire',
      'Devis remis avant tout traitement supérieur à 200 TND',
      'Tiers payant CNAM accepté',
    ],
    documentsRequis: ['Carte d\u2019adhérent', 'Carte CNAM (si applicable)'],
    fournisseurAdresse: 'Avenue de l\u2019Indépendance, Béja',
    fournisseurTelephone: '+216 78 880 880',
    fournisseurEmail: 'rdv@souriereplus-beja.tn',
    fournisseurContact: 'Dr Nadia Mansouri',
  },
];

export const mockConventionDemandes: ConventionDemande[] = [
  // Convention conv-001 — déjà adhérée (validée)
  {
    id: 'demc-001',
    conventionId: 'conv-001',
    adherentId: 'adh-001',
    adherentNom: 'Ahmed Ben Salah',
    dateDemande: '2024-12-10',
    statut: 'validee',
    dateDecision: '2024-12-15',
    commentaire: 'Demande pour bénéficier des remises pharmacie pour ma famille.',
  },
  // Convention conv-002 — demande en attente
  {
    id: 'demc-002',
    conventionId: 'conv-002',
    adherentId: 'adh-001',
    adherentNom: 'Ahmed Ben Salah',
    dateDemande: '2025-04-20',
    statut: 'en_attente',
    commentaire: 'Souhaite bénéficier des déjeuners du midi.',
  },
  // Convention conv-006 — refusée (expirée)
  {
    id: 'demc-003',
    conventionId: 'conv-006',
    adherentId: 'adh-001',
    adherentNom: 'Ahmed Ben Salah',
    dateDemande: '2025-04-05',
    statut: 'refusee',
    dateDecision: '2025-04-08',
    motifRefus: 'La convention est arrivée à échéance et n\u2019a pas été renouvelée par le fournisseur.',
  },
  // Une demande annulée par l'adhérent
  {
    id: 'demc-004',
    conventionId: 'conv-004',
    adherentId: 'adh-001',
    adherentNom: 'Ahmed Ben Salah',
    dateDemande: '2025-03-12',
    statut: 'annulee',
    dateDecision: '2025-03-13',
    commentaire: 'Demande initiale pour Carrefour.',
  },
  // Convention conv-007 (FitZone) — abonnement financé en 6 tranches, 2 déjà payées
  {
    id: 'demc-005',
    conventionId: 'conv-007',
    adherentId: 'adh-001',
    adherentNom: 'Ahmed Ben Salah',
    dateDemande: '2025-02-01',
    statut: 'validee',
    dateDecision: '2025-02-05',
    commentaire: 'Abonnement annuel salle de sport FitZone.',
    tranchesPayees: 2,
    montantOffreSnapshot: 600,
    nbTranchesSnapshot: 6,
  },
  // Convention conv-005 (Linguafrance) — cours de langue, aucune tranche encore prélevée
  {
    id: 'demc-006',
    conventionId: 'conv-005',
    adherentId: 'adh-001',
    adherentNom: 'Ahmed Ben Salah',
    dateDemande: '2025-04-12',
    statut: 'validee',
    dateDecision: '2025-04-15',
    commentaire: 'Cours d\u2019anglais sur 6 mois.',
    tranchesPayees: 0,
    montantOffreSnapshot: 480,
    nbTranchesSnapshot: 6,
  },
];

export const mockTicketsRestaurant: TicketRestaurant[] = [
  {
    id: 'tick-001',
    numero: 'TR-2024-001',
    typeBon: 'restaurant',
    montant: 8,
    statut: 'attribue',
    adherentId: 'adh-001',
    adherentNom: 'Ahmed Ben Salah',
    dateEmission: '2024-12-01',
  },
  {
    id: 'tick-002',
    numero: 'TR-2024-002',
    typeBon: 'cafeteria',
    montant: 5,
    statut: 'utilise',
    adherentId: 'adh-001',
    adherentNom: 'Ahmed Ben Salah',
    dateEmission: '2024-11-15',
  },
];

export const mockHistorique: HistoriqueFinanciere[] = [
  {
    id: 'hist-001',
    type: 'cotisation',
    description: 'Cotisation mensuelle Janvier 2024',
    montant: -50,
    date: '2024-01-15',
    reference: 'COT-2024-01',
  },
  {
    id: 'hist-002',
    type: 'pret',
    description: 'Remboursement prêt #pret-001',
    montant: -450,
    date: '2024-07-01',
    reference: 'REM-2024-07',
  },
  {
    id: 'hist-003',
    type: 'indemnite',
    description: 'Indemnité maladie',
    montant: 200,
    date: '2024-11-15',
    reference: 'IND-001',
  },
  {
    id: 'hist-004',
    type: 'cotisation',
    description: 'Cotisation mensuelle Décembre 2024',
    montant: -50,
    date: '2024-12-15',
    reference: 'COT-2024-12',
  },
  {
    id: 'hist-005',
    type: 'pret',
    description: 'Versement prêt #pret-001',
    montant: 5000,
    date: '2024-06-05',
    reference: 'PRET-001',
  },
  {
    id: 'hist-006',
    type: 'remboursement',
    description: 'Remboursement prêt #pret-002 (solde)',
    montant: -500,
    date: '2023-09-10',
    reference: 'REM-2023-09',
  },
];

// Dashboard aggregated data
export interface DashboardData {
  profile: Adherent;
  adhesion: Adhesion | null;
  activeLoan: PretSocial | null;
  pendingIndemnities: number;
  availableOffers: number;
  recentHistory: HistoriqueFinanciere[];
  financialChart: { month: string; solde: number }[];
}

export const mockDashboardData: DashboardData = {
  profile: mockAdherent,
  adhesion: mockAdhesion,
  activeLoan: mockPrets.find(p => p.statut === 'en_cours') || null,
  pendingIndemnities: mockIndemnites.filter(i => i.statut === 'en_attente').length,
  availableOffers: mockTicketsRestaurant.filter(t => t.statut === 'attribue').length,
  recentHistory: mockHistorique.slice(0, 5),
  financialChart: [
    { month: 'Juil', solde: 4500 },
    { month: 'Août', solde: 4050 },
    { month: 'Sept', solde: 3600 },
    { month: 'Oct', solde: 3750 },
    { month: 'Nov', solde: 3900 },
    { month: 'Déc', solde: 3800 },
  ],
};

// Simulate API delay
export function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
