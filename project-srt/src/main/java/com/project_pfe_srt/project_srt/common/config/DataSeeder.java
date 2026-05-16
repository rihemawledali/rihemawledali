package com.project_pfe_srt.project_srt.common.config;

import com.project_pfe_srt.project_srt.adherent.adhesion.entity.Adhesion;
import com.project_pfe_srt.project_srt.adherent.adhesion.repository.AdhesionRepository;
import com.project_pfe_srt.project_srt.adherent.convention.entity.ConventionDemande;
import com.project_pfe_srt.project_srt.adherent.convention.repository.ConventionDemandeRepository;
import com.project_pfe_srt.project_srt.adherent.historique.entity.HistoriqueFinanciere;
import com.project_pfe_srt.project_srt.adherent.historique.repository.HistoriqueRepository;
import com.project_pfe_srt.project_srt.adherent.indemnite.entity.Indemnite;
import com.project_pfe_srt.project_srt.adherent.indemnite.repository.IndemniteRepository;
import com.project_pfe_srt.project_srt.adherent.pret.entity.PretSocial;
import com.project_pfe_srt.project_srt.adherent.pret.repository.PretRepository;
import com.project_pfe_srt.project_srt.adherent.profile.entity.AdherentProfile;
import com.project_pfe_srt.project_srt.adherent.profile.repository.AdherentProfileRepository;
import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;
import com.project_pfe_srt.project_srt.shared.convention.entity.Convention;
import com.project_pfe_srt.project_srt.shared.convention.repository.ConventionRepository;
import com.project_pfe_srt.project_srt.shared.fournisseur.entity.Fournisseur;
import com.project_pfe_srt.project_srt.shared.fournisseur.repository.FournisseurRepository;
import com.project_pfe_srt.project_srt.treasurer.ticket.entity.TicketRestaurant;
import com.project_pfe_srt.project_srt.treasurer.ticket.repository.TicketRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Populates the database with a demo dataset for local development
 * when no users exist yet.
 *
 * Default demo credentials:
 *   - admin@srt.com / admin123 (ADMIN)
 *   - tresorier@srt.com / tres123 (TRESORIER)
 *   - ahmed.bensalah@example.com / demo123 (ADHERENT)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AdherentProfileRepository profileRepository;
    private final AdhesionRepository adhesionRepository;
    private final PretRepository pretRepository;
    private final IndemniteRepository indemniteRepository;
    private final TicketRepository ticketRepository;
    private final HistoriqueRepository historiqueRepository;
    private final FournisseurRepository fournisseurRepository;
    private final ConventionRepository conventionRepository;
    private final ConventionDemandeRepository conventionDemandeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("[Seeder] Users already exist — skipping demo seed.");
            return;
        }
        log.info("[Seeder] Empty database detected — seeding demo data.");

        // --- Users ---
        User admin = userRepository.save(User.builder()
                .nom("Administrateur").prenom("SRT")
                .email("admin@srt.com")
                .password(passwordEncoder.encode("admin123"))
                .role(Role.ADMIN)
                .telephone("+216 70 000 000")
                .matricule("ADM2024001")
                .statut("ACTIF")
                .build());

        User tres = userRepository.save(User.builder()
                .nom("Trabelsi").prenom("Sonia")
                .email("tresorier@srt.com")
                .password(passwordEncoder.encode("tres123"))
                .role(Role.TRESORIER)
                .telephone("+216 71 000 000")
                .matricule("TRE2024001")
                .statut("ACTIF")
                .build());

        User adh = userRepository.save(User.builder()
                .nom("Ben Salah").prenom("Ahmed")
                .email("ahmed.bensalah@example.com")
                .password(passwordEncoder.encode("demo123"))
                .role(Role.ADHERENT)
                .telephone("+216 20 123 456")
                .matricule("ADH2024001")
                .statut("ACTIF")
                .build());

        profileRepository.save(AdherentProfile.builder()
                .user(adh)
                .salaire(2500.0)
                .enfants(2)
                .marie(true)
                .dateNaissance(LocalDate.of(1988, 5, 12))
                .build());

        // --- Adhesions ---
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

        adhesionRepository.save(Adhesion.builder()
                .adherent(adh)
                .dateDebut(monthStart).dateFin(monthEnd)
                .montantCotisation(50.0)
                .statut("active")
                .build());

        adhesionRepository.save(Adhesion.builder()
                .adherent(adh)
                .dateDebut(LocalDate.of(2023, 1, 15))
                .dateFin(LocalDate.of(2024, 1, 14))
                .montantCotisation(45.0)
                .statut("expiree")
                .build());

        // --- Prêts ---
        pretRepository.save(PretSocial.builder()
                .adherent(adh)
                .montant(5000.0).duree(12).taux(2.5)
                .statut("en_cours")
                .dateDemande(LocalDate.of(2024, 6, 1))
                .dateAccord(LocalDate.of(2024, 6, 5))
                .motif("Travaux d'aménagement du domicile familial.")
                .build());
        pretRepository.save(PretSocial.builder()
                .adherent(adh)
                .montant(3000.0).duree(6).taux(2.0)
                .statut("rembourse")
                .dateDemande(LocalDate.of(2023, 3, 10))
                .dateAccord(LocalDate.of(2023, 3, 15))
                .motif("Achat de matériel informatique pour la famille.")
                .build());
        pretRepository.save(PretSocial.builder()
                .adherent(adh)
                .montant(2000.0).duree(3).taux(1.5)
                .statut("en_attente")
                .dateDemande(LocalDate.of(2024, 12, 20))
                .motif("Frais médicaux imprévus.")
                .build());

        // --- Indemnités ---
        indemniteRepository.save(Indemnite.builder()
                .adherent(adh)
                .type("maladie").montant(200.0).statut("approuvee")
                .dateDemande(LocalDate.of(2024, 11, 10))
                .motif("Hospitalisation de 3 jours suite à une intervention chirurgicale.")
                .build());
        indemniteRepository.save(Indemnite.builder()
                .adherent(adh)
                .type("naissance").montant(150.0).statut("en_attente")
                .dateDemande(LocalDate.of(2024, 12, 25))
                .motif("Naissance de mon deuxième enfant.")
                .build());

        // --- Tickets ---
        ticketRepository.save(TicketRestaurant.builder()
                .numero("TR-2024-001").typeBon("restaurant").montant(8.0)
                .statut("attribue").adherent(adh)
                .dateEmission(LocalDate.of(2024, 12, 1))
                .build());
        ticketRepository.save(TicketRestaurant.builder()
                .numero("TR-2024-002").typeBon("cafeteria").montant(5.0)
                .statut("utilise").adherent(adh)
                .dateEmission(LocalDate.of(2024, 11, 15))
                .build());

        // --- Historique ---
        historiqueRepository.save(HistoriqueFinanciere.builder()
                .adherent(adh).type("cotisation")
                .description("Cotisation mensuelle Janvier 2024")
                .montant(-50.0).date(LocalDate.of(2024, 1, 15))
                .reference("COT-2024-01").build());
        historiqueRepository.save(HistoriqueFinanciere.builder()
                .adherent(adh).type("pret")
                .description("Versement prêt #1")
                .montant(5000.0).date(LocalDate.of(2024, 6, 5))
                .reference("PRET-001").build());
        historiqueRepository.save(HistoriqueFinanciere.builder()
                .adherent(adh).type("remboursement")
                .description("Remboursement prêt #1 — Juillet")
                .montant(-450.0).date(LocalDate.of(2024, 7, 1))
                .reference("REM-2024-07").build());
        historiqueRepository.save(HistoriqueFinanciere.builder()
                .adherent(adh).type("indemnite")
                .description("Indemnité maladie")
                .montant(200.0).date(LocalDate.of(2024, 11, 15))
                .reference("IND-001").build());
        historiqueRepository.save(HistoriqueFinanciere.builder()
                .adherent(adh).type("cotisation")
                .description("Cotisation mensuelle Décembre 2024")
                .montant(-50.0).date(LocalDate.of(2024, 12, 15))
                .reference("COT-2024-12").build());

        // --- Fournisseurs + Conventions ---
        Fournisseur f1 = fournisseurRepository.save(Fournisseur.builder()
                .nom("Pharmacie Centrale Béja").categorie("sante")
                .adresse("15 Avenue Habib Bourguiba, Béja")
                .telephone("+216 78 234 567")
                .email("contact@pharmacie-beja.tn")
                .status("actif").build());
        Fournisseur f2 = fournisseurRepository.save(Fournisseur.builder()
                .nom("Restaurant Le Médina").categorie("restauration")
                .adresse("Rue de la Kasbah, Béja")
                .telephone("+216 78 765 432")
                .email("reservation@lemedina-beja.tn")
                .status("actif").build());
        Fournisseur f3 = fournisseurRepository.save(Fournisseur.builder()
                .nom("Carrefour Béja").categorie("commerce")
                .adresse("Zone Commerciale Nord, Béja")
                .telephone("+216 78 111 222")
                .email("beja@carrefour.tn")
                .status("actif").build());

        Convention c1 = conventionRepository.save(Convention.builder()
                .fournisseur(f1).type("sante")
                .dateDebut(LocalDate.of(2025, 1, 1))
                .dateFin(LocalDate.of(2026, 12, 31))
                .remise(15.0).statut("active")
                .description("Remise sur médicaments et parapharmacie").build());
        Convention c2 = conventionRepository.save(Convention.builder()
                .fournisseur(f2).type("restauration")
                .dateDebut(LocalDate.of(2025, 3, 15))
                .dateFin(LocalDate.of(2026, 3, 14))
                .remise(20.0).statut("active")
                .description("Menu du midi à tarif réduit").build());
        Convention c3 = conventionRepository.save(Convention.builder()
                .fournisseur(f3).type("commerce")
                .dateDebut(LocalDate.of(2024, 1, 1))
                .dateFin(LocalDate.of(2024, 12, 31))
                .remise(10.0).statut("expiree")
                .description("Bons d'achat avec 10% de remise").build());

        // --- Convention demandes ---
        conventionDemandeRepository.save(ConventionDemande.builder()
                .convention(c1).adherent(adh)
                .dateDemande(LocalDate.of(2024, 12, 10))
                .statut("validee")
                .dateDecision(LocalDate.of(2024, 12, 15))
                .commentaire("Demande pour bénéficier des remises pharmacie pour ma famille.")
                .build());
        conventionDemandeRepository.save(ConventionDemande.builder()
                .convention(c2).adherent(adh)
                .dateDemande(LocalDate.of(2025, 4, 20))
                .statut("en_attente")
                .commentaire("Souhaite bénéficier des déjeuners du midi.")
                .build());
        conventionDemandeRepository.save(ConventionDemande.builder()
                .convention(c3).adherent(adh)
                .dateDemande(LocalDate.of(2025, 4, 5))
                .statut("refusee")
                .dateDecision(LocalDate.of(2025, 4, 8))
                .motifRefus("La convention est arrivée à échéance et n'a pas été renouvelée par le fournisseur.")
                .build());

        log.info("[Seeder] Demo seed complete: {} users, {} prêts, {} indemnités, {} conventions, {} demandes.",
                userRepository.count(),
                pretRepository.count(),
                indemniteRepository.count(),
                conventionRepository.count(),
                conventionDemandeRepository.count());

        log.info("[Seeder] Demo accounts: admin@srt.com / admin123, tresorier@srt.com / tres123, ahmed.bensalah@example.com / demo123 — id={} / {} / {}.",
                admin.getId(), tres.getId(), adh.getId());
    }
}
