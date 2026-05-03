package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.PaiementDto;
import com.project_pfe_srt.project_srt.dto.PaiementRequest;
import com.project_pfe_srt.project_srt.entity.*;
import com.project_pfe_srt.project_srt.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PaiementService {

    private static final Set<String> TYPES = Set.of(
            "PAIEMENT_FACTURE_FOURNISSEUR", "PAIEMENT_INDEMNITE", "AUTRE_SORTIE");
    private static final Set<String> BENEF_TYPES = Set.of("FOURNISSEUR", "ADHERENT", "AUTRE");
    private static final Set<String> MODES = Set.of("virement", "cheque", "especes", "carte");
    private static final Set<String> STATUTS = Set.of("reussi", "en_attente", "echoue", "rembourse");

    private final PaiementRepository paiementRepository;
    private final FactureRepository factureRepository;
    private final IndemniteRepository indemniteRepository;
    private final TreasuryLedger ledger;

    public List<PaiementDto> list() {
        return paiementRepository.findAllByOrderByDateDesc().stream()
                .map(PaiementDto::from).toList();
    }

    public PaiementDto getById(Long id) {
        return paiementRepository.findById(id).map(PaiementDto::from)
                .orElseThrow(() -> new IllegalArgumentException("Paiement introuvable."));
    }

    /** Generates a new unique reference like "PAY-2025-0042". */
    public String nextReference() {
        long count = paiementRepository.count() + 1;
        for (int i = 0; i < 1000; i++) {
            String ref = String.format("PAY-%d-%04d", Year.now().getValue(), count + i);
            if (!paiementRepository.existsByReference(ref)) return ref;
        }
        return "PAY-" + Year.now().getValue() + "-" + System.currentTimeMillis();
    }

    private static String requireOneOf(Set<String> allowed, String value, String label) {
        if (value == null) throw new IllegalArgumentException(label + " requis.");
        String v = value.trim();
        if (!allowed.contains(v)) throw new IllegalArgumentException(label + " invalide.");
        return v;
    }

    /**
     * Generic creation. Typically used by the trésorier UI for "Autre sortie".
     * For workflow paiements, prefer {@link #payFacture} / {@link #payIndemnite}.
     */
    @Transactional
    public PaiementDto create(PaiementRequest req, String currentUserName) {
        if (req.getMontant() == null || req.getMontant() <= 0) {
            throw new IllegalArgumentException("Montant invalide.");
        }
        String type = requireOneOf(TYPES,
                req.getTypePaiement() == null ? "AUTRE_SORTIE" : req.getTypePaiement(), "Type de paiement");
        String benefType = requireOneOf(BENEF_TYPES,
                req.getBeneficiaireType() == null ? "AUTRE" : req.getBeneficiaireType(), "Type bénéficiaire");
        String mode = requireOneOf(MODES, req.getMode(), "Mode de paiement");
        String statut = requireOneOf(STATUTS,
                req.getStatut() == null ? "reussi" : req.getStatut(), "Statut");

        if (req.getBeneficiaire() == null || req.getBeneficiaire().isBlank()) {
            throw new IllegalArgumentException("Bénéficiaire requis.");
        }

        String ref = (req.getReference() == null || req.getReference().isBlank())
                ? nextReference() : req.getReference().trim();
        if (paiementRepository.existsByReference(ref)) {
            throw new IllegalArgumentException("Référence de paiement déjà utilisée.");
        }

        Facture facture = null;
        if (req.getFactureId() != null) {
            facture = factureRepository.findById(req.getFactureId())
                    .orElseThrow(() -> new IllegalArgumentException("Facture introuvable."));
        }
        Indemnite indemnite = null;
        if (req.getIndemniteId() != null) {
            indemnite = indemniteRepository.findById(req.getIndemniteId())
                    .orElseThrow(() -> new IllegalArgumentException("Indemnité introuvable."));
        }

        Paiement p = Paiement.builder()
                .reference(ref)
                .typePaiement(type)
                .beneficiaireType(benefType)
                .beneficiaireId(req.getBeneficiaireId())
                .beneficiaire(req.getBeneficiaire().trim())
                .facture(facture)
                .indemnite(indemnite)
                .montant(req.getMontant())
                .mode(mode)
                .statut(statut)
                .description(req.getDescription())
                .date(LocalDateTime.now())
                .build();
        Paiement saved = paiementRepository.save(p);

        if ("reussi".equals(statut)) {
            applyTreasuryFor(saved, currentUserName);
        }
        return PaiementDto.from(saved);
    }

    @Transactional
    public PaiementDto payFacture(Long factureId, PaiementRequest req, String currentUserName) {
        Facture f = factureRepository.findById(factureId)
                .orElseThrow(() -> new IllegalArgumentException("Facture introuvable."));
        if ("payee".equalsIgnoreCase(f.getStatut())) {
            throw new IllegalArgumentException("Facture déjà payée.");
        }
        if ("annulee".equalsIgnoreCase(f.getStatut())) {
            throw new IllegalArgumentException("Facture annulée.");
        }
        // Force workflow defaults.
        req.setTypePaiement("PAIEMENT_FACTURE_FOURNISSEUR");
        req.setBeneficiaireType("FOURNISSEUR");
        req.setBeneficiaireId(f.getFournisseur() == null ? null : f.getFournisseur().getId());
        if (req.getBeneficiaire() == null || req.getBeneficiaire().isBlank()) {
            req.setBeneficiaire(f.getFournisseur() == null ? "—" : f.getFournisseur().getNom());
        }
        if (req.getMontant() == null) req.setMontant(f.getMontant());
        if (req.getDescription() == null || req.getDescription().isBlank()) {
            req.setDescription("Paiement facture fournisseur " + f.getNumero());
        }
        req.setFactureId(f.getId());
        if (req.getStatut() == null) req.setStatut("reussi");

        PaiementDto created = create(req, currentUserName);

        // Mark facture as paid only if the payment actually went through.
        if ("reussi".equalsIgnoreCase(created.getStatut())) {
            f.setStatut("payee");
            factureRepository.save(f);
        }
        return created;
    }

    @Transactional
    public PaiementDto payIndemnite(Long indemniteId, PaiementRequest req, String currentUserName) {
        Indemnite i = indemniteRepository.findById(indemniteId)
                .orElseThrow(() -> new IllegalArgumentException("Indemnité introuvable."));
        String s = i.getStatut();
        if ("payee".equalsIgnoreCase(s)) throw new IllegalArgumentException("Indemnité déjà payée.");
        if (!"approuvee".equalsIgnoreCase(s) && !"validee".equalsIgnoreCase(s)) {
            throw new IllegalArgumentException("Indemnité non validée.");
        }

        req.setTypePaiement("PAIEMENT_INDEMNITE");
        req.setBeneficiaireType("ADHERENT");
        req.setBeneficiaireId(i.getAdherent() == null ? null : i.getAdherent().getId());
        if (req.getBeneficiaire() == null || req.getBeneficiaire().isBlank()) {
            var u = i.getAdherent();
            req.setBeneficiaire(u == null ? "—"
                    : (u.getPrenom() == null ? "" : u.getPrenom() + " ") + (u.getNom() == null ? "" : u.getNom()));
        }
        if (req.getMontant() == null) req.setMontant(i.getMontant());
        if (req.getDescription() == null || req.getDescription().isBlank()) {
            req.setDescription("Paiement indemnité " + i.getId());
        }
        req.setIndemniteId(i.getId());
        if (req.getStatut() == null) req.setStatut("reussi");

        PaiementDto created = create(req, currentUserName);

        if ("reussi".equalsIgnoreCase(created.getStatut())) {
            i.setStatut("payee");
            indemniteRepository.save(i);
        }
        return created;
    }

    @Transactional
    public PaiementDto valider(Long id, String currentUserName) {
        Paiement p = paiementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Paiement introuvable."));
        if ("reussi".equalsIgnoreCase(p.getStatut())) return PaiementDto.from(p);
        p.setStatut("reussi");
        Paiement saved = paiementRepository.save(p);
        applyTreasuryFor(saved, currentUserName);
        return PaiementDto.from(saved);
    }

    @Transactional
    public PaiementDto annuler(Long id) {
        Paiement p = paiementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Paiement introuvable."));
        boolean wasReussi = "reussi".equalsIgnoreCase(p.getStatut());
        p.setStatut("rembourse");
        Paiement saved = paiementRepository.save(p);
        if (wasReussi) {
            ledger.reverseByReference(p.getReference());
        }
        return PaiementDto.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        Paiement p = paiementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Paiement introuvable."));
        if ("reussi".equalsIgnoreCase(p.getStatut())) {
            ledger.reverseByReference(p.getReference());
        }
        paiementRepository.delete(p);
    }

    // ---- helpers ----

    /** Builds the historique row + decrements the compte for a successful Paiement. */
    private void applyTreasuryFor(Paiement p, String userName) {
        String sourceType = switch (p.getTypePaiement()) {
            case "PAIEMENT_FACTURE_FOURNISSEUR" -> "FACTURE";
            case "PAIEMENT_INDEMNITE" -> "INDEMNITE";
            default -> "AUTRE";
        };
        Long refId = p.getFacture() != null ? p.getFacture().getId()
                : p.getIndemnite() != null ? p.getIndemnite().getId()
                : null;
        String description = p.getDescription();
        if (description == null || description.isBlank()) {
            if (p.getFacture() != null) description = "Paiement facture fournisseur " + p.getFacture().getNumero();
            else if (p.getIndemnite() != null) description = "Paiement indemnité " + p.getIndemnite().getId();
            else description = "Sortie " + p.getReference();
        }
        ledger.applySortie(p.getMontant(), sourceType, refId, description,
                p.getReference(), p.getMode(), p.getStatut(), userName);
    }

}
