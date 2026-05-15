/* ============================================
   Seed data for the mock DB (French realistic data)
   ============================================ */

import type {
  Utilisateur, Adherent, PretSocial, Adhesion, Indemnite,
  BonCommande, TicketRestaurant, Convention, Fournisseur,
  Facture, Paiement, CompteBancaire, HistoriqueFinanciere,
} from '../shared/types/domain';

const today = new Date();
const isoDaysAgo = (n: number) => new Date(today.getTime() - n * 86400000).toISOString();
const isoDaysAhead = (n: number) => new Date(today.getTime() + n * 86400000).toISOString();

// ---------- Utilisateurs ----------
export const seedUtilisateurs: Utilisateur[] = [
  { id: 'u_001', nom: 'Ben Salah', prenom: 'Ahmed', email: 'ahmed.bensalah@srt.tn', telephone: '+216 22 123 456', role: 'admin', status: 'actif', matricule: 'ADM001', createdAt: isoDaysAgo(420) },
  { id: 'u_002', nom: 'Trabelsi', prenom: 'Sonia', email: 'sonia.trabelsi@srt.tn', telephone: '+216 23 234 567', role: 'treasurer', status: 'actif', matricule: 'TRS001', createdAt: isoDaysAgo(380) },
  { id: 'u_003', nom: 'Mansouri', prenom: 'Karim', email: 'karim.mansouri@srt.tn', telephone: '+216 24 345 678', role: 'manager', status: 'actif', matricule: 'MGR001', createdAt: isoDaysAgo(360) },
  { id: 'u_004', nom: 'Khelifi', prenom: 'Leila', email: 'leila.khelifi@srt.tn', telephone: '+216 25 456 789', role: 'manager', status: 'actif', matricule: 'MGR002', createdAt: isoDaysAgo(310) },
  { id: 'u_005', nom: 'Gharbi', prenom: 'Mohamed', email: 'mohamed.gharbi@srt.tn', telephone: '+216 26 567 890', role: 'adherent', status: 'actif', matricule: 'ADH001', createdAt: isoDaysAgo(280) },
  { id: 'u_006', nom: 'Saidi', prenom: 'Nadia', email: 'nadia.saidi@srt.tn', telephone: '+216 27 678 901', role: 'adherent', status: 'actif', matricule: 'ADH002', createdAt: isoDaysAgo(240) },
  { id: 'u_007', nom: 'Bouzid', prenom: 'Hichem', email: 'hichem.bouzid@srt.tn', telephone: '+216 28 789 012', role: 'adherent', status: 'inactif', matricule: 'ADH003', createdAt: isoDaysAgo(200) },
  { id: 'u_008', nom: 'Jelassi', prenom: 'Amina', email: 'amina.jelassi@srt.tn', telephone: '+216 29 890 123', role: 'adherent', status: 'actif', matricule: 'ADH004', createdAt: isoDaysAgo(180) },
  { id: 'u_009', nom: 'Hamdi', prenom: 'Yassine', email: 'yassine.hamdi@srt.tn', telephone: '+216 50 111 222', role: 'adherent', status: 'suspendu', matricule: 'ADH005', createdAt: isoDaysAgo(150) },
  { id: 'u_010', nom: 'Chaabane', prenom: 'Rim', email: 'rim.chaabane@srt.tn', telephone: '+216 51 222 333', role: 'adherent', status: 'actif', matricule: 'ADH006', createdAt: isoDaysAgo(120) },
  { id: 'u_011', nom: 'Ferchichi', prenom: 'Walid', email: 'walid.ferchichi@srt.tn', telephone: '+216 52 333 444', role: 'adherent', status: 'actif', matricule: 'ADH007', createdAt: isoDaysAgo(100) },
  { id: 'u_012', nom: 'Mejri', prenom: 'Imen', email: 'imen.mejri@srt.tn', telephone: '+216 53 444 555', role: 'adherent', status: 'actif', matricule: 'ADH008', createdAt: isoDaysAgo(80) },
  { id: 'u_013', nom: 'Slim', prenom: 'Tarek', email: 'tarek.slim@srt.tn', telephone: '+216 54 555 666', role: 'manager', status: 'inactif', matricule: 'MGR003', createdAt: isoDaysAgo(60) },
  { id: 'u_014', nom: 'Belhaj', prenom: 'Olfa', email: 'olfa.belhaj@srt.tn', telephone: '+216 55 666 777', role: 'treasurer', status: 'actif', matricule: 'TRS002', createdAt: isoDaysAgo(40) },
  { id: 'u_015', nom: 'Riahi', prenom: 'Sami', email: 'sami.riahi@srt.tn', telephone: '+216 56 777 888', role: 'adherent', status: 'actif', matricule: 'ADH009', createdAt: isoDaysAgo(20) },
];

// ---------- Adhérents (extension) ----------
export const seedAdherents: Adherent[] = seedUtilisateurs
  .filter((u) => u.role === 'adherent')
  .map((u, i) => ({
    ...u,
    salaire: 1200 + i * 180,
    enfants: i % 4,
    marie: i % 2 === 0,
  }));

// ---------- Fournisseurs ----------
export const seedFournisseurs: Fournisseur[] = [
  { id: 'f_001', nom: 'Pharmacie Centrale', adresse: '12 Av. Bourguiba, Tunis', telephone: '+216 71 100 100', email: 'contact@pharmacie-centrale.tn', categorie: 'sante', status: 'actif', createdAt: isoDaysAgo(500) },
  { id: 'f_002', nom: 'Restaurant Le Golfe', adresse: 'Marina, La Goulette', telephone: '+216 71 200 200', email: 'reservation@legolfe.tn', categorie: 'restauration', status: 'actif', createdAt: isoDaysAgo(450) },
  { id: 'f_003', nom: 'Auto-École Express', adresse: 'Av. de Carthage, Sousse', telephone: '+216 73 300 300', email: 'info@autoexpress.tn', categorie: 'transport', status: 'actif', createdAt: isoDaysAgo(400) },
  { id: 'f_004', nom: 'Librairie El Kitab', adresse: 'Av. de France, Tunis', telephone: '+216 71 400 400', email: 'commande@elkitab.tn', categorie: 'education', status: 'actif', createdAt: isoDaysAgo(380) },
  { id: 'f_005', nom: 'Clinique El Amen', adresse: 'Mutuelleville, Tunis', telephone: '+216 71 500 500', email: 'admin@elamen.tn', categorie: 'sante', status: 'actif', createdAt: isoDaysAgo(360) },
  { id: 'f_006', nom: 'Cinéma Le Colisée', adresse: 'Av. Habib Bourguiba, Tunis', telephone: '+216 71 600 600', email: 'billetterie@colisee.tn', categorie: 'loisir', status: 'actif', createdAt: isoDaysAgo(340) },
  { id: 'f_007', nom: 'Supermarché Carrefour', adresse: 'Centre Urbain Nord, Tunis', telephone: '+216 71 700 700', email: 'service@carrefour.tn', categorie: 'commerce', status: 'actif', createdAt: isoDaysAgo(320) },
  { id: 'f_008', nom: 'Hôtel Diplomat', adresse: 'Av. de la Liberté, Tunis', telephone: '+216 71 800 800', email: 'reservations@diplomat.tn', categorie: 'loisir', status: 'inactif', createdAt: isoDaysAgo(300) },
  { id: 'f_009', nom: 'Optic 2000', adresse: 'Manar 2, Tunis', telephone: '+216 71 900 900', email: 'contact@optic2000.tn', categorie: 'sante', status: 'actif', createdAt: isoDaysAgo(280) },
  { id: 'f_010', nom: 'Café Journal', adresse: 'La Marsa', telephone: '+216 71 010 010', email: 'hello@cafejournal.tn', categorie: 'restauration', status: 'actif', createdAt: isoDaysAgo(260) },
  { id: 'f_011', nom: 'Transport Confort', adresse: 'Sfax', telephone: '+216 74 020 020', email: 'info@confort.tn', categorie: 'transport', status: 'actif', createdAt: isoDaysAgo(240) },
  { id: 'f_012', nom: 'École Montessori', adresse: 'El Menzah, Tunis', telephone: '+216 71 030 030', email: 'admission@montessori.tn', categorie: 'education', status: 'actif', createdAt: isoDaysAgo(220) },
];

// ---------- Conventions ----------
export const seedConventions: Convention[] = [
  { id: 'c_001', fournisseurId: 'f_001', fournisseurNom: 'Pharmacie Centrale', type: 'sante', dateDebut: isoDaysAgo(300), dateFin: isoDaysAhead(60), remise: 15, statut: 'active', description: 'Remise sur médicaments et parapharmacie' },
  { id: 'c_002', fournisseurId: 'f_002', fournisseurNom: 'Restaurant Le Golfe', type: 'restauration', dateDebut: isoDaysAgo(180), dateFin: isoDaysAhead(180), remise: 20, statut: 'active', description: 'Menus à tarif préférentiel pour les adhérents' },
  { id: 'c_003', fournisseurId: 'f_003', fournisseurNom: 'Auto-École Express', type: 'transport', dateDebut: isoDaysAgo(400), dateFin: isoDaysAgo(20), remise: 10, statut: 'expiree', description: 'Forfait permis B' },
  { id: 'c_004', fournisseurId: 'f_004', fournisseurNom: 'Librairie El Kitab', type: 'education', dateDebut: isoDaysAgo(120), dateFin: isoDaysAhead(245), remise: 12, statut: 'active' },
  { id: 'c_005', fournisseurId: 'f_005', fournisseurNom: 'Clinique El Amen', type: 'sante', dateDebut: isoDaysAgo(60), dateFin: isoDaysAhead(15), remise: 25, statut: 'active', description: 'Consultations spécialisées' },
  { id: 'c_006', fournisseurId: 'f_006', fournisseurNom: 'Cinéma Le Colisée', type: 'loisir', dateDebut: isoDaysAgo(50), dateFin: isoDaysAhead(310), remise: 30, statut: 'active' },
  { id: 'c_007', fournisseurId: 'f_007', fournisseurNom: 'Supermarché Carrefour', type: 'commerce', dateDebut: isoDaysAgo(20), dateFin: isoDaysAhead(345), remise: 8, statut: 'en_negociation' },
  { id: 'c_008', fournisseurId: 'f_009', fournisseurNom: 'Optic 2000', type: 'sante', dateDebut: isoDaysAgo(200), dateFin: isoDaysAhead(160), remise: 18, statut: 'active' },
  { id: 'c_009', fournisseurId: 'f_010', fournisseurNom: 'Café Journal', type: 'restauration', dateDebut: isoDaysAgo(90), dateFin: isoDaysAgo(5), remise: 15, statut: 'expiree' },
  { id: 'c_010', fournisseurId: 'f_012', fournisseurNom: 'École Montessori', type: 'education', dateDebut: isoDaysAgo(15), dateFin: isoDaysAhead(700), remise: 22, statut: 'active', description: 'Frais de scolarité réduits' },
];

// ---------- Prêts sociaux ----------
const adherentRefs = seedAdherents.slice(0, 9);
export const seedPrets: PretSocial[] = [
  { id: 'p_001', adherentId: adherentRefs[0].id, adherentNom: `${adherentRefs[0].prenom} ${adherentRefs[0].nom}`, montant: 5000, duree: 24, taux: 3.5, statut: 'en_cours', dateDemande: isoDaysAgo(120), dateAccord: isoDaysAgo(115) },
  { id: 'p_002', adherentId: adherentRefs[1].id, adherentNom: `${adherentRefs[1].prenom} ${adherentRefs[1].nom}`, montant: 8000, duree: 36, taux: 4.0, statut: 'en_cours', dateDemande: isoDaysAgo(200), dateAccord: isoDaysAgo(195) },
  { id: 'p_003', adherentId: adherentRefs[2].id, adherentNom: `${adherentRefs[2].prenom} ${adherentRefs[2].nom}`, montant: 3000, duree: 12, taux: 3.0, statut: 'rembourse', dateDemande: isoDaysAgo(400), dateAccord: isoDaysAgo(395) },
  { id: 'p_004', adherentId: adherentRefs[3].id, adherentNom: `${adherentRefs[3].prenom} ${adherentRefs[3].nom}`, montant: 12000, duree: 48, taux: 4.5, statut: 'en_retard', dateDemande: isoDaysAgo(300), dateAccord: isoDaysAgo(290) },
  { id: 'p_005', adherentId: adherentRefs[4].id, adherentNom: `${adherentRefs[4].prenom} ${adherentRefs[4].nom}`, montant: 6500, duree: 24, taux: 3.5, statut: 'en_attente', dateDemande: isoDaysAgo(10) },
  { id: 'p_006', adherentId: adherentRefs[5].id, adherentNom: `${adherentRefs[5].prenom} ${adherentRefs[5].nom}`, montant: 4000, duree: 18, taux: 3.2, statut: 'en_cours', dateDemande: isoDaysAgo(60), dateAccord: isoDaysAgo(55) },
  { id: 'p_007', adherentId: adherentRefs[6].id, adherentNom: `${adherentRefs[6].prenom} ${adherentRefs[6].nom}`, montant: 9000, duree: 36, taux: 4.0, statut: 'en_attente', dateDemande: isoDaysAgo(5) },
  { id: 'p_008', adherentId: adherentRefs[7].id, adherentNom: `${adherentRefs[7].prenom} ${adherentRefs[7].nom}`, montant: 2500, duree: 12, taux: 3.0, statut: 'rejete', dateDemande: isoDaysAgo(80) },
  { id: 'p_009', adherentId: adherentRefs[8].id, adherentNom: `${adherentRefs[8].prenom} ${adherentRefs[8].nom}`, montant: 7000, duree: 24, taux: 3.8, statut: 'en_cours', dateDemande: isoDaysAgo(150), dateAccord: isoDaysAgo(145) },
];

// ---------- Adhésions ----------
export const seedAdhesions: Adhesion[] = seedAdherents.map((a, i) => ({
  id: `ad_${100 + i}`,
  adherentId: a.id,
  dateDebut: isoDaysAgo(400 - i * 20),
  dateFin: isoDaysAhead(365 - i * 20),
  montantCotisation: 25 + (i % 3) * 5,
  statut: i % 7 === 0 ? 'expiree' : i % 5 === 0 ? 'suspendue' : 'active',
}));

// ---------- Indemnités ----------
export const seedIndemnites: Indemnite[] = [
  { id: 'i_001', adherentId: adherentRefs[0].id, adherentNom: `${adherentRefs[0].prenom} ${adherentRefs[0].nom}`, type: 'maladie', montant: 350, statut: 'payee', dateDemande: isoDaysAgo(45) },
  { id: 'i_002', adherentId: adherentRefs[1].id, adherentNom: `${adherentRefs[1].prenom} ${adherentRefs[1].nom}`, type: 'naissance', montant: 800, statut: 'approuvee', dateDemande: isoDaysAgo(20) },
  { id: 'i_003', adherentId: adherentRefs[2].id, adherentNom: `${adherentRefs[2].prenom} ${adherentRefs[2].nom}`, type: 'mariage', montant: 1500, statut: 'en_attente', dateDemande: isoDaysAgo(7) },
  { id: 'i_004', adherentId: adherentRefs[3].id, adherentNom: `${adherentRefs[3].prenom} ${adherentRefs[3].nom}`, type: 'scolarite', montant: 600, statut: 'payee', dateDemande: isoDaysAgo(90) },
  { id: 'i_005', adherentId: adherentRefs[4].id, adherentNom: `${adherentRefs[4].prenom} ${adherentRefs[4].nom}`, type: 'deces', montant: 2000, statut: 'rejetee', dateDemande: isoDaysAgo(60) },
];

// ---------- Bons de commande ----------
export const seedBonsCommande: BonCommande[] = [
  { id: 'bc_001', numero: 'BC-2025-0001', adherentId: adherentRefs[0].id, adherentNom: `${adherentRefs[0].prenom} ${adherentRefs[0].nom}`, fournisseurId: 'f_007', fournisseurNom: 'Supermarché Carrefour', montant: 200, statut: 'attribue', dateEmission: isoDaysAgo(15), dateExpiration: isoDaysAhead(75) },
  { id: 'bc_002', numero: 'BC-2025-0002', adherentId: adherentRefs[1].id, adherentNom: `${adherentRefs[1].prenom} ${adherentRefs[1].nom}`, fournisseurId: 'f_004', fournisseurNom: 'Librairie El Kitab', montant: 150, statut: 'utilise', dateEmission: isoDaysAgo(50), dateExpiration: isoDaysAhead(40) },
  { id: 'bc_003', numero: 'BC-2025-0003', fournisseurId: 'f_001', fournisseurNom: 'Pharmacie Centrale', montant: 100, statut: 'en_attente', dateEmission: isoDaysAgo(2), dateExpiration: isoDaysAhead(88) },
  { id: 'bc_004', numero: 'BC-2025-0004', adherentId: adherentRefs[2].id, adherentNom: `${adherentRefs[2].prenom} ${adherentRefs[2].nom}`, fournisseurId: 'f_007', fournisseurNom: 'Supermarché Carrefour', montant: 250, statut: 'attribue', dateEmission: isoDaysAgo(8), dateExpiration: isoDaysAhead(82) },
  { id: 'bc_005', numero: 'BC-2024-0099', adherentId: adherentRefs[3].id, adherentNom: `${adherentRefs[3].prenom} ${adherentRefs[3].nom}`, fournisseurId: 'f_009', fournisseurNom: 'Optic 2000', montant: 350, statut: 'expire', dateEmission: isoDaysAgo(180), dateExpiration: isoDaysAgo(10) },
  { id: 'bc_006', numero: 'BC-2025-0005', fournisseurId: 'f_004', fournisseurNom: 'Librairie El Kitab', montant: 120, statut: 'en_attente', dateEmission: isoDaysAgo(1), dateExpiration: isoDaysAhead(89) },
];

// ---------- Tickets restaurant ----------
export const seedTicketsRestaurant: TicketRestaurant[] = [
  { id: 'tr_001', numero: 'TR-2025-1001', typeBon: 'restaurant', montant: 8, statut: 'attribue', adherentId: adherentRefs[0].id, adherentNom: `${adherentRefs[0].prenom} ${adherentRefs[0].nom}`, dateEmission: isoDaysAgo(5) },
  { id: 'tr_002', numero: 'TR-2025-1002', typeBon: 'restaurant', montant: 8, statut: 'utilise', adherentId: adherentRefs[1].id, adherentNom: `${adherentRefs[1].prenom} ${adherentRefs[1].nom}`, dateEmission: isoDaysAgo(20) },
  { id: 'tr_003', numero: 'TR-2025-1003', typeBon: 'cafeteria', montant: 5, statut: 'en_attente', dateEmission: isoDaysAgo(1) },
  { id: 'tr_004', numero: 'TR-2025-1004', typeBon: 'restaurant', montant: 8, statut: 'attribue', adherentId: adherentRefs[2].id, adherentNom: `${adherentRefs[2].prenom} ${adherentRefs[2].nom}`, dateEmission: isoDaysAgo(3) },
  { id: 'tr_005', numero: 'TR-2025-1005', typeBon: 'cafeteria', montant: 5, statut: 'utilise', adherentId: adherentRefs[3].id, adherentNom: `${adherentRefs[3].prenom} ${adherentRefs[3].nom}`, dateEmission: isoDaysAgo(15) },
  { id: 'tr_006', numero: 'TR-2025-1006', typeBon: 'restaurant', montant: 8, statut: 'en_attente', dateEmission: isoDaysAgo(0) },
];

// ---------- Factures ----------
export const seedFactures: Facture[] = [
  { id: 'fa_001', numero: 'FAC-2025-0001', fournisseurId: 'f_001', fournisseurNom: 'Pharmacie Centrale', montant: 4500, statut: 'payee', dateEmission: isoDaysAgo(60), dateEcheance: isoDaysAgo(30) },
  { id: 'fa_002', numero: 'FAC-2025-0002', fournisseurId: 'f_002', fournisseurNom: 'Restaurant Le Golfe', montant: 2800, statut: 'impayee', dateEmission: isoDaysAgo(40), dateEcheance: isoDaysAhead(5) },
  { id: 'fa_003', numero: 'FAC-2025-0003', fournisseurId: 'f_007', fournisseurNom: 'Supermarché Carrefour', montant: 6200, statut: 'partielle', dateEmission: isoDaysAgo(25), dateEcheance: isoDaysAhead(20) },
  { id: 'fa_004', numero: 'FAC-2025-0004', fournisseurId: 'f_005', fournisseurNom: 'Clinique El Amen', montant: 8900, statut: 'en_retard', dateEmission: isoDaysAgo(80), dateEcheance: isoDaysAgo(20) },
  { id: 'fa_005', numero: 'FAC-2025-0005', fournisseurId: 'f_004', fournisseurNom: 'Librairie El Kitab', montant: 1700, statut: 'payee', dateEmission: isoDaysAgo(90), dateEcheance: isoDaysAgo(60) },
  { id: 'fa_006', numero: 'FAC-2025-0006', fournisseurId: 'f_009', fournisseurNom: 'Optic 2000', montant: 3300, statut: 'impayee', dateEmission: isoDaysAgo(15), dateEcheance: isoDaysAhead(15) },
  { id: 'fa_007', numero: 'FAC-2025-0007', fournisseurId: 'f_010', fournisseurNom: 'Café Journal', montant: 950, statut: 'payee', dateEmission: isoDaysAgo(35), dateEcheance: isoDaysAgo(5) },
  { id: 'fa_008', numero: 'FAC-2025-0008', fournisseurId: 'f_006', fournisseurNom: 'Cinéma Le Colisée', montant: 2200, statut: 'partielle', dateEmission: isoDaysAgo(10), dateEcheance: isoDaysAhead(20) },
];

// ---------- Paiements ----------
export const seedPaiements: Paiement[] = [
  { id: 'pa_001', reference: 'PAY-2025-0001', factureId: 'fa_001', factureNumero: 'FAC-2025-0001', beneficiaire: 'Pharmacie Centrale', montant: 4500, mode: 'virement', statut: 'reussi', date: isoDaysAgo(28) },
  { id: 'pa_002', reference: 'PAY-2025-0002', factureId: 'fa_005', factureNumero: 'FAC-2025-0005', beneficiaire: 'Librairie El Kitab', montant: 1700, mode: 'cheque', statut: 'reussi', date: isoDaysAgo(58) },
  { id: 'pa_003', reference: 'PAY-2025-0003', factureId: 'fa_007', factureNumero: 'FAC-2025-0007', beneficiaire: 'Café Journal', montant: 950, mode: 'virement', statut: 'reussi', date: isoDaysAgo(4) },
  { id: 'pa_004', reference: 'PAY-2025-0004', factureId: 'fa_003', factureNumero: 'FAC-2025-0003', beneficiaire: 'Supermarché Carrefour', montant: 3000, mode: 'virement', statut: 'reussi', date: isoDaysAgo(12) },
  { id: 'pa_005', reference: 'PAY-2025-0005', factureId: 'fa_008', factureNumero: 'FAC-2025-0008', beneficiaire: 'Cinéma Le Colisée', montant: 1100, mode: 'carte', statut: 'reussi', date: isoDaysAgo(7) },
  { id: 'pa_006', reference: 'PAY-2025-0006', beneficiaire: 'Sonia Trabelsi', montant: 2500, mode: 'virement', statut: 'en_attente', date: isoDaysAgo(1) },
  { id: 'pa_007', reference: 'PAY-2025-0007', beneficiaire: 'Karim Mansouri', montant: 1800, mode: 'especes', statut: 'echoue', date: isoDaysAgo(3) },
  { id: 'pa_008', reference: 'PAY-2025-0008', beneficiaire: 'Mohamed Gharbi', montant: 350, mode: 'virement', statut: 'reussi', date: isoDaysAgo(14) },
];

// ---------- Comptes bancaires ----------
export const seedComptes: CompteBancaire[] = [
  { id: 'cb_001', banque: 'Banque de Tunisie', iban: 'TN59 1000 1000 0000 1234 5678', solde: 124500, devise: 'TND' },
  { id: 'cb_002', banque: 'BIAT', iban: 'TN59 0810 1010 0000 9876 5432', solde: 78300, devise: 'TND' },
  { id: 'cb_003', banque: 'Attijari Bank', iban: 'TN59 0420 4204 0000 5555 6666', solde: 12000, devise: 'EUR' },
];

// ---------- Historique financier (rich) ----------
function makeHistorique(): HistoriqueFinanciere[] {
  const ops: HistoriqueFinanciere[] = [];
  for (let i = 0; i < 60; i++) {
    type LegacyOp = 'credit' | 'debit' | 'pret' | 'remboursement' | 'cotisation' | 'indemnite' | 'facture';
    const types: LegacyOp[] = ['credit','debit','pret','remboursement','cotisation','indemnite','facture'];
    const t = types[i % types.length];
    const sign = ['debit', 'pret', 'indemnite', 'facture'].includes(t) ? -1 : 1;
    const amount = sign * Math.round((300 + Math.random() * 4500));
    const descriptions: Record<LegacyOp, string> = {
      credit: 'Versement bancaire',
      debit: 'Prélèvement bancaire',
      pret: 'Décaissement prêt social',
      remboursement: 'Remboursement échéance prêt',
      cotisation: 'Encaissement cotisation adhérent',
      indemnite: 'Versement indemnité',
      facture: 'Règlement facture fournisseur',
    };
    ops.push({
      id: `h_${1000 + i}`,
      type: t,
      description: descriptions[t],
      montant: amount,
      date: isoDaysAgo(i * 6 + Math.floor(Math.random() * 5)),
      reference: `OP-${2025}-${String(1000 + i).padStart(4, '0')}`,
      utilisateur: ['Sonia Trabelsi', 'Olfa Belhaj', 'Système'][i % 3],
    });
  }
  return ops;
}
export const seedHistorique: HistoriqueFinanciere[] = makeHistorique();
