package com.project_pfe_srt.project_srt.treasurer.facture.service;

import com.project_pfe_srt.project_srt.adherent.convention.dto.ConventionDemandeDto;
import com.project_pfe_srt.project_srt.adherent.convention.entity.ConventionDemande;
import com.project_pfe_srt.project_srt.adherent.convention.repository.ConventionDemandeRepository;
import com.project_pfe_srt.project_srt.common.exception.NotFoundException;
import com.project_pfe_srt.project_srt.common.util.DateParser;
import com.project_pfe_srt.project_srt.common.util.Money;
import com.project_pfe_srt.project_srt.common.util.Repos;
import com.project_pfe_srt.project_srt.common.util.Validators;
import com.project_pfe_srt.project_srt.shared.convention.dto.ConventionFactureGenerationRequest;
import com.project_pfe_srt.project_srt.shared.convention.entity.Convention;
import com.project_pfe_srt.project_srt.shared.convention.entity.TypeAvantage;
import com.project_pfe_srt.project_srt.shared.fournisseur.entity.Fournisseur;
import com.project_pfe_srt.project_srt.shared.fournisseur.repository.FournisseurRepository;
import com.project_pfe_srt.project_srt.treasurer.facture.dto.FactureDto;
import com.project_pfe_srt.project_srt.treasurer.facture.dto.FactureRequest;
import com.project_pfe_srt.project_srt.treasurer.facture.entity.Facture;
import com.project_pfe_srt.project_srt.treasurer.facture.repository.FactureRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FactureService {

    static final Set<String> STATUTS = Set.of(
            "brouillon", "non_payee", "impayee", "partielle", "en_retard", "payee", "annulee",
            "GENEREE", "VALIDEE", "EN_PAIEMENT", "PAYEE");

    static final List<String> APPROVED_DEMANDE_STATUSES = List.of("APPROUVEE", "validee", "VALIDEE");

    private final FactureRepository factureRepository;
    private final FournisseurRepository fournisseurRepository;
    private final ConventionDemandeRepository demandeRepository;

    public List<FactureDto> list() {
        return factureRepository.findAllByOrderByDateEmissionDesc()
                .stream().map(FactureDto::from).toList();
    }

    public FactureDto getById(Long id) {
        return FactureDto.from(findFacture(id));
    }

    @Transactional(readOnly = true)
    public List<ConventionDemandeDto> eligibleConventionDemandes(Long fournisseurId, Integer mois, Integer annee) {
        requireConventionPeriod(fournisseurId, mois, annee);
        return demandeRepository
                .findByConventionFournisseurIdAndStatutInAndFactureIsNullOrderByDateDemandeDesc(
                        fournisseurId,
                        APPROVED_DEMANDE_STATUSES)
                .stream()
                .filter(this::isFacturableConventionDemande)
                .map(this::withComputedAmounts)
                .map(ConventionDemandeDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ConventionDemandeDto> conventionFactureDetails(Long factureId) {
        return demandeRepository.findByFactureIdOrderByIdAsc(factureId)
                .stream()
                .map(ConventionDemandeDto::from)
                .toList();
    }

    public FactureDto create(FactureRequest req) {
        String numero = Validators.requireNonBlank(req.getNumero(), "Numero");
        if (factureRepository.existsByNumero(numero)) {
            throw new IllegalArgumentException("Numero de facture deja utilise.");
        }
        double montant = Validators.requirePositive(req.getMontant(), "Montant");
        if (req.getFournisseurId() == null) {
            throw new IllegalArgumentException("Le fournisseur est requis.");
        }
        Fournisseur fournisseur = Repos.findOrThrow(
                fournisseurRepository, req.getFournisseurId(), "Fournisseur");

        LocalDate emission = DateParser.parseIsoDate(req.getDateEmission(), "d'emission");
        LocalDate echeance = DateParser.parseIsoDate(req.getDateEcheance(), "d'echeance");
        if (echeance.isBefore(emission)) {
            throw new IllegalArgumentException("La date d'echeance doit etre apres la date d'emission.");
        }

        Facture facture = Facture.builder()
                .numero(numero)
                .fournisseur(fournisseur)
                .montant(montant)
                .statut(requireStatut(req.getStatut(), "non_payee"))
                .dateEmission(emission)
                .dateEcheance(echeance)
                .description(req.getDescription())
                .sourceType(sourceType(req.getSourceType()))
                .mois(req.getMois())
                .annee(req.getAnnee())
                .build();
        return FactureDto.from(factureRepository.save(facture));
    }

    @Transactional
    public FactureDto generateConventionFacture(ConventionFactureGenerationRequest req) {
        Long fournisseurId = req == null ? null : req.getFournisseurId();
        Integer mois = req == null ? null : req.getMois();
        Integer annee = req == null ? null : req.getAnnee();
        requireConventionPeriod(fournisseurId, mois, annee);
        if (req.getDemandeIds() == null || req.getDemandeIds().isEmpty()) {
            throw new IllegalArgumentException("Selection de demandes requise.");
        }
        Fournisseur fournisseur = Repos.findOrThrow(fournisseurRepository, fournisseurId, "Fournisseur");
        factureRepository.findByFournisseurIdAndSourceTypeAndMoisAndAnnee(fournisseurId, "CONVENTION", mois, annee)
                .ifPresent(f -> {
                    throw new IllegalArgumentException("Une facture convention existe deja pour ce fournisseur et ce mois.");
                });

        List<ConventionDemande> demandes = new ArrayList<>();
        for (Long id : req.getDemandeIds()) {
            ConventionDemande demande = Repos.findOrThrow(demandeRepository, id, "Demande de convention");
            validateSelectedDemande(demande, fournisseurId);
            demandes.add(withComputedAmounts(demande));
        }

        double total = Money.round2(demandes.stream().mapToDouble(d -> Money.orZero(d.getMontantAmicale())).sum());
        if (total <= 0) {
            throw new IllegalArgumentException("Aucun montant amicale a facturer.");
        }

        LocalDate emission = LocalDate.now();
        Facture facture = factureRepository.save(Facture.builder()
                .numero(nextConventionNumero(fournisseurId))
                .fournisseur(fournisseur)
                .montant(total)
                .statut("GENEREE")
                .dateEmission(emission)
                .dateEcheance(emission.plusDays(30))
                .description("Facture convention " + String.format("%02d/%d", mois, annee))
                .sourceType("CONVENTION")
                .mois(mois)
                .annee(annee)
                .build());

        for (ConventionDemande demande : demandes) {
            demande.setFacture(facture);
            demande.setFactureMois(mois);
            demande.setFactureAnnee(annee);
            demande.setStatut("FACTUREE");
        }
        demandeRepository.saveAll(demandes);
        return FactureDto.from(facture);
    }

    public FactureDto update(Long id, FactureRequest req) {
        Facture f = findFacture(id);

        if (req.getNumero() != null && !req.getNumero().equalsIgnoreCase(f.getNumero())) {
            if (factureRepository.existsByNumero(req.getNumero())) {
                throw new IllegalArgumentException("Numero de facture deja utilise.");
            }
            f.setNumero(req.getNumero().trim());
        }
        if (req.getFournisseurId() != null) {
            f.setFournisseur(Repos.findOrThrow(
                    fournisseurRepository, req.getFournisseurId(), "Fournisseur"));
        }
        if (req.getMontant() != null) {
            f.setMontant(Validators.requirePositive(req.getMontant(), "Montant"));
        }
        if (req.getStatut() != null) f.setStatut(requireStatut(req.getStatut(), f.getStatut()));
        if (req.getDateEmission() != null) f.setDateEmission(DateParser.parseIsoDate(req.getDateEmission(), "d'emission"));
        if (req.getDateEcheance() != null) f.setDateEcheance(DateParser.parseIsoDate(req.getDateEcheance(), "d'echeance"));
        if (req.getDescription() != null) f.setDescription(req.getDescription());
        if (req.getSourceType() != null) f.setSourceType(sourceType(req.getSourceType()));
        if (req.getMois() != null) f.setMois(req.getMois());
        if (req.getAnnee() != null) f.setAnnee(req.getAnnee());
        if (f.getDateEcheance().isBefore(f.getDateEmission())) {
            throw new IllegalArgumentException("La date d'echeance doit etre apres la date d'emission.");
        }

        return FactureDto.from(factureRepository.save(f));
    }

    @Transactional
    public FactureDto annuler(Long id) {
        Facture f = findFacture(id);
        if ("payee".equalsIgnoreCase(f.getStatut()) || "PAYEE".equalsIgnoreCase(f.getStatut())) {
            throw new IllegalArgumentException("Impossible d'annuler une facture deja payee.");
        }
        if ("CONVENTION".equalsIgnoreCase(f.getSourceType())) {
            if (!"GENEREE".equalsIgnoreCase(f.getStatut())) {
                throw new IllegalArgumentException("Seule une facture convention generee peut etre annulee.");
            }
            for (ConventionDemande demande : demandeRepository.findByFactureIdOrderByIdAsc(id)) {
                clearConventionFactureLink(demande);
            }
        }
        f.setStatut("annulee");
        return FactureDto.from(factureRepository.save(f));
    }

    @Transactional
    public FactureDto validerConventionFacture(Long id) {
        Facture f = findFacture(id);
        if (!"CONVENTION".equalsIgnoreCase(f.getSourceType())) {
            throw new IllegalArgumentException("Facture convention requise.");
        }
        if (!"GENEREE".equalsIgnoreCase(f.getStatut())) {
            throw new IllegalArgumentException("Seule une facture convention generee peut etre validee.");
        }
        YearMonth start = YearMonth.of(f.getAnnee(), f.getMois()).plusMonths(1);
        for (ConventionDemande demande : demandeRepository.findByFactureIdOrderByIdAsc(id)) {
            ConventionDemande computed = withComputedAmounts(demande);
            computed.setRetenueMoisDebut(start.getMonthValue());
            computed.setRetenueAnneeDebut(start.getYear());
        }
        f.setStatut("VALIDEE");
        return FactureDto.from(factureRepository.save(f));
    }

    public void delete(Long id) {
        if (!factureRepository.existsById(id)) {
            throw NotFoundException.of("Facture");
        }
        factureRepository.deleteById(id);
    }

    private Facture findFacture(Long id) {
        return Repos.findOrThrow(factureRepository, id, "Facture");
    }

    private void requireConventionPeriod(Long fournisseurId, Integer mois, Integer annee) {
        if (fournisseurId == null) {
            throw new IllegalArgumentException("Fournisseur requis.");
        }
        if (mois == null || mois < 1 || mois > 12) {
            throw new IllegalArgumentException("Mois invalide.");
        }
        if (annee == null || annee < 2000) {
            throw new IllegalArgumentException("Annee invalide.");
        }
    }

    private boolean isFacturableConventionDemande(ConventionDemande demande) {
        Convention c = demande.getConvention();
        return c != null
                && c.getTypeAvantage() != null
                && c.getTypeAvantage() != TypeAvantage.REMISE_DIRECTE
                && Money.orZero(c.getMontantAvantage()) > 0;
    }

    private void validateSelectedDemande(ConventionDemande demande, Long fournisseurId) {
        if (!isApprovedDemandeStatus(demande.getStatut())) {
            throw new IllegalArgumentException("Seules les demandes approuvees peuvent etre facturees.");
        }
        if (demande.getFacture() != null) {
            throw new IllegalArgumentException("Demande deja rattachee a une facture.");
        }
        Convention c = demande.getConvention();
        if (c == null || c.getFournisseur() == null || !fournisseurId.equals(c.getFournisseur().getId())) {
            throw new IllegalArgumentException("Toutes les demandes doivent appartenir au fournisseur selectionne.");
        }
        if (!isFacturableConventionDemande(demande)) {
            throw new IllegalArgumentException("Demande non facturable.");
        }
    }

    private ConventionDemande withComputedAmounts(ConventionDemande demande) {
        Convention c = demande.getConvention();
        double total = Money.round2(Money.orZero(c.getMontantAvantage()));
        double pct = Money.orZero(c.getPourcentageAdherent());
        double adherent = Money.round2(total * pct / 100d);
        int months = retenueMonths(c);
        demande.setMontantTotal(total);
        demande.setMontantAdherent(adherent);
        demande.setMontantAmicale(Money.round2(total - adherent));
        demande.setRetenueNombreMois(months);
        demande.setRetenueMontantMensuel(Money.round2(adherent / months));
        return demande;
    }

    private static void clearConventionFactureLink(ConventionDemande demande) {
        demande.setFacture(null);
        demande.setFactureMois(null);
        demande.setFactureAnnee(null);
        demande.setMontantTotal(null);
        demande.setMontantAdherent(null);
        demande.setMontantAmicale(null);
        demande.setRetenueMoisDebut(null);
        demande.setRetenueAnneeDebut(null);
        demande.setRetenueNombreMois(null);
        demande.setRetenueMontantMensuel(null);
        demande.setStatut("APPROUVEE");
    }

    private static int retenueMonths(Convention c) {
        Integer configured = c.getNombreMoisRetenue();
        if (configured != null && configured > 0) {
            return configured;
        }
        if (c.getTypeAvantage() == TypeAvantage.ACHAT_TRANCHE) {
            throw new IllegalArgumentException("Nombre de mois de retenue requis pour un achat tranche.");
        }
        return 1;
    }

    private static boolean isApprovedDemandeStatus(String statut) {
        if (statut == null) return false;
        for (String approved : APPROVED_DEMANDE_STATUSES) {
            if (approved.equalsIgnoreCase(statut)) return true;
        }
        return false;
    }

    private String nextConventionNumero(Long fournisseurId) {
        String base = "CONV-" + Year.now().getValue() + "-" + fournisseurId + "-";
        long seed = factureRepository.count() + 1;
        for (int i = 0; i < 1000; i++) {
            String numero = base + String.format("%04d", seed + i);
            if (!factureRepository.existsByNumero(numero)) return numero;
        }
        return base + System.currentTimeMillis();
    }

    private static String requireStatut(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        if (STATUTS.contains(value)) return value;
        return Validators.requireOneOfLower(STATUTS, value, "Statut de facture");
    }

    private static String sourceType(String value) {
        return value == null || value.isBlank() ? "MANUEL" : value.trim().toUpperCase();
    }
}
