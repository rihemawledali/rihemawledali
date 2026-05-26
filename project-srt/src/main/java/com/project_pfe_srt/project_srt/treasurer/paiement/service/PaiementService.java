package com.project_pfe_srt.project_srt.treasurer.paiement.service;

import com.project_pfe_srt.project_srt.adherent.convention.repository.ConventionDemandeRepository;
import com.project_pfe_srt.project_srt.adherent.indemnite.entity.Indemnite;
import com.project_pfe_srt.project_srt.adherent.indemnite.repository.IndemniteRepository;
import com.project_pfe_srt.project_srt.common.util.Repos;
import com.project_pfe_srt.project_srt.common.util.UserNames;
import com.project_pfe_srt.project_srt.common.util.Validators;
import com.project_pfe_srt.project_srt.shared.tresorerie.entity.CompteBancaire;
import com.project_pfe_srt.project_srt.shared.tresorerie.service.TreasuryLedger;
import com.project_pfe_srt.project_srt.treasurer.facture.entity.Facture;
import com.project_pfe_srt.project_srt.treasurer.facture.repository.FactureRepository;
import com.project_pfe_srt.project_srt.treasurer.paiement.dto.PaiementDto;
import com.project_pfe_srt.project_srt.treasurer.paiement.dto.PaiementRequest;
import com.project_pfe_srt.project_srt.treasurer.paiement.entity.Paiement;
import com.project_pfe_srt.project_srt.treasurer.paiement.repository.PaiementRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Set;

/**
 * Outgoing payments (sorties de trésorerie). Three flavours:
 *
 * <ul>
 *   <li>{@code PAIEMENT_FACTURE_FOURNISSEUR} — pays a supplier invoice;
 *       flips the {@link Facture} to {@code payee} on success.</li>
 *   <li>{@code PAIEMENT_INDEMNITE} — pays an approved indemnité; flips
 *       the {@link Indemnite} to {@code payee} on success.</li>
 *   <li>{@code AUTRE_SORTIE} — free-form treasury withdrawal.</li>
 * </ul>
 *
 * Every successful paiement is written to the trésorerie ledger via
 * {@link TreasuryLedger#applySortie}. Cancellation reverses the ledger
 * entry by reference.
 */
@Service
@RequiredArgsConstructor
public class PaiementService {

    // ---- vocabulary -----------------------------------------------------

    private static final String TYPE_FACTURE = "PAIEMENT_FACTURE_FOURNISSEUR";
    private static final String TYPE_INDEMNITE = "PAIEMENT_INDEMNITE";
    private static final String TYPE_AUTRE = "AUTRE_SORTIE";

    private static final String BENEF_FOURNISSEUR = "FOURNISSEUR";
    private static final String BENEF_ADHERENT = "ADHERENT";
    private static final String BENEF_AUTRE = "AUTRE";

    private static final String STATUT_REUSSI = "reussi";
    private static final String STATUT_REMBOURSE = "rembourse";

    private static final Set<String> TYPES = Set.of(TYPE_FACTURE, TYPE_INDEMNITE, TYPE_AUTRE);
    private static final Set<String> BENEF_TYPES = Set.of(BENEF_FOURNISSEUR, BENEF_ADHERENT, BENEF_AUTRE);
    private static final Set<String> MODES = Set.of("virement", "cheque", "especes", "carte");
    private static final Set<String> STATUTS = Set.of(STATUT_REUSSI, "en_attente", "echoue", STATUT_REMBOURSE);

    // ---- collaborators --------------------------------------------------

    private final PaiementRepository paiementRepository;
    private final FactureRepository factureRepository;
    private final IndemniteRepository indemniteRepository;
    private final TreasuryLedger ledger;
    private final ConventionDemandeRepository conventionDemandeRepository;

    // =====================================================================
    // Read
    // =====================================================================

    public List<PaiementDto> list() {
        return paiementRepository.findAllByOrderByDateDesc().stream()
                .map(PaiementDto::from).toList();
    }

    public PaiementDto getById(Long id) {
        return PaiementDto.from(findPaiement(id));
    }

    /** Generates a new unique reference like {@code "PAY-2025-0042"}. */
    public String nextReference() {
        long count = paiementRepository.count() + 1;
        for (int i = 0; i < 1000; i++) {
            String ref = String.format("PAY-%d-%04d", Year.now().getValue(), count + i);
            if (!paiementRepository.existsByReference(ref)) return ref;
        }
        return "PAY-" + Year.now().getValue() + "-" + System.currentTimeMillis();
    }

    // =====================================================================
    // Create
    // =====================================================================

    /**
     * Generic creation. Typically used by the trésorier UI for «Autre
     * sortie». For workflow paiements, prefer {@link #payFacture} /
     * {@link #payIndemnite}.
     */
    @Transactional
    public PaiementDto create(PaiementRequest req, String currentUserName) {
        return createInternal(req, currentUserName, false);
    }

    private PaiementDto createInternal(PaiementRequest req, String currentUserName, boolean allowLinkedSource) {
        if (req == null) {
            req = new PaiementRequest();
        }
        Validators.requirePositive(req.getMontant(), "Montant");
        String type = Validators.requireOneOf(TYPES,
                req.getTypePaiement() == null ? TYPE_AUTRE : req.getTypePaiement(), "Type de paiement");
        if (!allowLinkedSource && !TYPE_AUTRE.equals(type)) {
            throw new IllegalArgumentException("Utilisez le workflow facture ou indemnite pour ce paiement.");
        }
        if (!allowLinkedSource && (req.getFactureId() != null || req.getIndemniteId() != null)) {
            throw new IllegalArgumentException("Utilisez le workflow facture ou indemnite pour ce paiement.");
        }
        String benefType = Validators.requireOneOf(BENEF_TYPES,
                req.getBeneficiaireType() == null ? BENEF_AUTRE : req.getBeneficiaireType(), "Type bénéficiaire");
        String mode = Validators.requireOneOf(MODES, req.getMode(), "Mode de paiement");
        String statut = Validators.requireOneOf(STATUTS,
                req.getStatut() == null ? STATUT_REUSSI : req.getStatut(), "Statut");
        String beneficiaire = Validators.requireNonBlank(req.getBeneficiaire(), "Bénéficiaire");

        String ref = (req.getReference() == null || req.getReference().isBlank())
                ? nextReference() : req.getReference().trim();
        if (paiementRepository.existsByReference(ref)) {
            throw new IllegalArgumentException("Référence de paiement déjà utilisée.");
        }

        Facture facture = req.getFactureId() == null ? null
                : Repos.findOrThrow(factureRepository, req.getFactureId(), "Facture");
        Indemnite indemnite = req.getIndemniteId() == null ? null
                : Repos.findOrThrow(indemniteRepository, req.getIndemniteId(), "Indemnité");

        CompteBancaire compteBancaire = resolveCompteForPayment(req, statut);

        Paiement saved = paiementRepository.save(Paiement.builder()
                .reference(ref)
                .typePaiement(type)
                .beneficiaireType(benefType)
                .beneficiaireId(req.getBeneficiaireId())
                .beneficiaire(beneficiaire)
                .facture(facture)
                .indemnite(indemnite)
                .compteBancaire(compteBancaire)
                .montant(req.getMontant())
                .mode(mode)
                .statut(statut)
                .description(req.getDescription())
                .date(LocalDateTime.now())
                .build());

        if (STATUT_REUSSI.equals(statut)) {
            applyTreasuryFor(saved, currentUserName);
        }
        return PaiementDto.from(saved);
    }

    @Transactional
    public PaiementDto payFacture(Long factureId, PaiementRequest req, String currentUserName) {
        if (req == null) req = new PaiementRequest();
        Facture f = Repos.findOrThrow(factureRepository, factureId, "Facture");
        if ("PAYEE".equalsIgnoreCase(f.getStatut())) throw new IllegalArgumentException("Facture deja payee.");
        if ("CONVENTION".equalsIgnoreCase(f.getSourceType())
                && !"VALIDEE".equalsIgnoreCase(f.getStatut())
                && !"EN_PAIEMENT".equalsIgnoreCase(f.getStatut())) {
            throw new IllegalArgumentException("La facture convention doit etre validee avant paiement.");
        }
        if ("payee".equalsIgnoreCase(f.getStatut())) throw new IllegalArgumentException("Facture déjà payée.");
        if ("annulee".equalsIgnoreCase(f.getStatut())) throw new IllegalArgumentException("Facture annulée.");

        prefillFromFacture(req, f);
        PaiementDto created = createInternal(req, currentUserName, true);

        if (STATUT_REUSSI.equalsIgnoreCase(created.getStatut())) {
            f.setStatut(paidFactureStatus(f));
            factureRepository.save(f);
            markConventionDemandesPaid(f);
        }
        return created;
    }

    @Transactional
    public PaiementDto payIndemnite(Long indemniteId, PaiementRequest req, String currentUserName) {
        if (req == null) req = new PaiementRequest();
        Indemnite i = Repos.findOrThrow(indemniteRepository, indemniteId, "Indemnité");
        String s = i.getStatut();
        if ("payee".equalsIgnoreCase(s)) throw new IllegalArgumentException("Indemnité déjà payée.");
        if (!"approuvee".equalsIgnoreCase(s) && !"validee".equalsIgnoreCase(s)) {
            throw new IllegalArgumentException("Indemnité non validée.");
        }

        prefillFromIndemnite(req, i);
        PaiementDto created = createInternal(req, currentUserName, true);

        if (STATUT_REUSSI.equalsIgnoreCase(created.getStatut())) {
            i.setStatut("payee");
            indemniteRepository.save(i);
        }
        return created;
    }

    // =====================================================================
    // State transitions
    // =====================================================================

    @Transactional
    public PaiementDto valider(Long id, String currentUserName) {
        Paiement p = findPaiement(id);
        if (!"en_attente".equalsIgnoreCase(p.getStatut())) {
            throw new IllegalArgumentException("Seul un paiement en attente peut être validé.");
        }
        requirePaymentCompte(p);
        p.setStatut(STATUT_REUSSI);
        Paiement saved = paiementRepository.save(p);
        applyTreasuryFor(saved, currentUserName);
        markSourcePaid(saved);
        return PaiementDto.from(saved);
    }

    @Transactional
    public PaiementDto annuler(Long id) {
        Paiement p = findPaiement(id);
        boolean wasReussi = STATUT_REUSSI.equalsIgnoreCase(p.getStatut());
        p.setStatut(STATUT_REMBOURSE);
        Paiement saved = paiementRepository.save(p);
        if (wasReussi) ledger.reverseByReference(p.getReference());
        return PaiementDto.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        Paiement p = findPaiement(id);
        if (STATUT_REUSSI.equalsIgnoreCase(p.getStatut())) {
            ledger.reverseByReference(p.getReference());
        }
        paiementRepository.delete(p);
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private Paiement findPaiement(Long id) {
        return Repos.findOrThrow(paiementRepository, id, "Paiement");
    }

    private CompteBancaire resolveCompteForPayment(PaiementRequest req, String statut) {
        if (req.getCompteBancaireId() == null) {
            if (STATUT_REUSSI.equalsIgnoreCase(statut)) {
                throw new IllegalArgumentException("Compte bancaire obligatoire.");
            }
            return null;
        }
        return ledger.resolveCompte(req.getCompteBancaireId());
    }

    /** Force workflow defaults on the request so {@link #create} produces a coherent paiement. */
    private static void prefillFromFacture(PaiementRequest req, Facture f) {
        req.setTypePaiement(TYPE_FACTURE);
        req.setBeneficiaireType(BENEF_FOURNISSEUR);
        req.setBeneficiaireId(f.getFournisseur() == null ? null : f.getFournisseur().getId());
        if (isBlank(req.getBeneficiaire())) {
            req.setBeneficiaire(f.getFournisseur() == null ? "—" : f.getFournisseur().getNom());
        }
        req.setMontant(f.getMontant());
        if (isBlank(req.getDescription())) {
            req.setDescription("Paiement facture fournisseur " + f.getNumero());
        }
        req.setFactureId(f.getId());
        if (req.getStatut() == null) req.setStatut(STATUT_REUSSI);
    }

    private static void prefillFromIndemnite(PaiementRequest req, Indemnite i) {
        req.setTypePaiement(TYPE_INDEMNITE);
        req.setBeneficiaireType(BENEF_ADHERENT);
        req.setBeneficiaireId(i.getAdherent() == null ? null : i.getAdherent().getId());
        if (isBlank(req.getBeneficiaire())) {
            String full = UserNames.fullName(i.getAdherent());
            req.setBeneficiaire(full.isEmpty() ? "—" : full);
        }
        req.setMontant(i.getMontant());
        if (isBlank(req.getDescription())) {
            req.setDescription("Paiement indemnité " + i.getId());
        }
        req.setIndemniteId(i.getId());
        if (req.getStatut() == null) req.setStatut(STATUT_REUSSI);
    }

    private void markSourcePaid(Paiement paiement) {
        if (paiement.getFacture() != null) {
            Facture facture = paiement.getFacture();
            facture.setStatut(paidFactureStatus(facture));
            factureRepository.save(facture);
            markConventionDemandesPaid(facture);
        }
        if (paiement.getIndemnite() != null) {
            Indemnite indemnite = paiement.getIndemnite();
            indemnite.setStatut("payee");
            indemniteRepository.save(indemnite);
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static String paidFactureStatus(Facture facture) {
        return "CONVENTION".equalsIgnoreCase(facture.getSourceType()) ? "PAYEE" : "payee";
    }

    private void markConventionDemandesPaid(Facture facture) {
        if (!"CONVENTION".equalsIgnoreCase(facture.getSourceType()) || facture.getId() == null) {
            return;
        }
        var demandes = conventionDemandeRepository.findByFactureIdOrderByIdAsc(facture.getId());
        for (var demande : demandes) {
            demande.setStatut("PAYEE");
        }
        conventionDemandeRepository.saveAll(demandes);
    }

    /** Builds the historique row + decrements the compte for a successful paiement. */
    private void applyTreasuryFor(Paiement p, String userName) {
        requirePaymentCompte(p);
        String sourceType = switch (p.getTypePaiement()) {
            case TYPE_FACTURE -> "FOURNISSEUR";
            case TYPE_INDEMNITE -> "INDEMNITE";
            default -> "AUTRE";
        };
        Long refId = p.getId();
        String description = p.getDescription();
        if (isBlank(description)) {
            if (p.getFacture() != null) description = "Paiement facture fournisseur " + p.getFacture().getNumero();
            else if (p.getIndemnite() != null) description = "Paiement indemnité " + p.getIndemnite().getId();
            else description = "Sortie " + p.getReference();
        }
        Long compteId = p.getCompteBancaire() != null ? p.getCompteBancaire().getId() : null;
        ledger.applySortie(compteId, p.getMontant(), "PAIEMENT", sourceType, refId, description,
                p.getReference(), p.getMode(), p.getStatut(), userName);
    }

    private static void requirePaymentCompte(Paiement paiement) {
        if (paiement.getCompteBancaire() == null || paiement.getCompteBancaire().getId() == null) {
            throw new IllegalArgumentException("Compte bancaire obligatoire.");
        }
    }
}
