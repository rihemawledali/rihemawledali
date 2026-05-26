package com.project_pfe_srt.project_srt.shared.convention.service;

import com.project_pfe_srt.project_srt.common.exception.NotFoundException;
import com.project_pfe_srt.project_srt.common.util.DateParser;
import com.project_pfe_srt.project_srt.common.util.Repos;
import com.project_pfe_srt.project_srt.common.util.Validators;
import com.project_pfe_srt.project_srt.shared.convention.dto.ConventionDto;
import com.project_pfe_srt.project_srt.shared.convention.dto.ConventionRequest;
import com.project_pfe_srt.project_srt.shared.convention.entity.Convention;
import com.project_pfe_srt.project_srt.shared.convention.entity.TypeAvantage;
import com.project_pfe_srt.project_srt.shared.convention.repository.ConventionRepository;
import com.project_pfe_srt.project_srt.shared.file.entity.Attachment;
import com.project_pfe_srt.project_srt.shared.file.repository.AttachmentRepository;
import com.project_pfe_srt.project_srt.shared.fournisseur.entity.Fournisseur;
import com.project_pfe_srt.project_srt.shared.fournisseur.repository.FournisseurRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ConventionService {

    private static final Set<String> TYPES = Set.of(
            "sante", "restauration", "transport", "loisir", "commerce", "education");
    private static final Set<String> STATUTS = Set.of(
            "active", "expiree", "en_negociation", "suspendue");

    private final ConventionRepository conventionRepository;
    private final FournisseurRepository fournisseurRepository;
    private final AttachmentRepository attachmentRepository;

    @Transactional(readOnly = true)
    public List<ConventionDto> list() {
        return conventionRepository.findAllByOrderByDateDebutDescIdDesc().stream()
                .map(ConventionDto::from)
                .toList();
    }

    @Transactional
    public ConventionDto create(ConventionRequest request) {
        Fournisseur fournisseur = requireFournisseur(parseRequiredFournisseurId(request.getFournisseurId()));
        validateRemise(request.getRemise());
        LocalDate debut = parseDate(request.getDateDebut(), "de debut");
        LocalDate fin = parseDate(request.getDateFin(), "de fin");
        validateDateRange(debut, fin);

        TypeAvantage typeAvantage = parseRequiredTypeAvantage(request.getTypeAvantage());
        ConventionFields conventionFields = validateConventionFields(request, typeAvantage);
        Attachment documentConvention = request.getDocumentConventionId() == null ? null
                : requireAttachment(request.getDocumentConventionId());

        Convention convention = Convention.builder()
                .fournisseur(fournisseur)
                .type(requireType(request.getType()))
                .dateDebut(debut)
                .dateFin(fin)
                .remise(request.getRemise())
                .statut(requireStatut(request.getStatut(), "active"))
                .description(request.getDescription())
                .typeConvention(request.getTypeConvention())
                .typeAvantage(typeAvantage)
                .pourcentageAdherent(conventionFields.pourcentageAdherent())
                .montantAvantage(conventionFields.montantAvantage())
                .nombreMoisRetenue(conventionFields.nombreMoisRetenue())
                .quantiteDisponible(conventionFields.quantiteDisponible())
                .autoriseAyantsDroit(Boolean.TRUE.equals(request.getAutoriseAyantsDroit()))
                .documentConvention(documentConvention)
                .build();

        return ConventionDto.from(conventionRepository.save(convention));
    }

    @Transactional
    public ConventionDto update(Long id, ConventionRequest request) {
        Convention convention = requireConvention(id);

        if (request.getFournisseurId() != null && !request.getFournisseurId().isBlank()) {
            convention.setFournisseur(requireFournisseur(parseFournisseurId(request.getFournisseurId())));
        }
        if (request.getType() != null) {
            convention.setType(requireType(request.getType()));
        }
        if (request.getDateDebut() != null) {
            convention.setDateDebut(parseDate(request.getDateDebut(), "de debut"));
        }
        if (request.getDateFin() != null) {
            convention.setDateFin(parseDate(request.getDateFin(), "de fin"));
        }
        if (request.getRemise() != null) {
            validateRemise(request.getRemise());
            convention.setRemise(request.getRemise());
        }
        if (request.getStatut() != null) {
            convention.setStatut(requireStatut(request.getStatut(), convention.getStatut()));
        }
        if (request.getDescription() != null) {
            convention.setDescription(request.getDescription());
        }
        if (request.getTypeConvention() != null) {
            convention.setTypeConvention(request.getTypeConvention());
        }
        updateConventionFields(convention, request);
        validateDateRange(convention.getDateDebut(), convention.getDateFin());

        return ConventionDto.from(convention);
    }

    @Transactional
    public Map<String, String> delete(Long id) {
        if (!conventionRepository.existsById(id)) {
            throw NotFoundException.of("Convention");
        }
        conventionRepository.deleteById(id);
        return Map.of("message", "Convention supprimee.");
    }

    public static String requireType(String value) {
        return Validators.requireOneOfLower(TYPES, value, "Type");
    }

    public static String requireStatut(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        return Validators.requireOneOfLower(STATUTS, value, "Statut");
    }

    public static TypeAvantage parseTypeAvantage(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return TypeAvantage.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Type d'avantage invalide.");
        }
    }

    private static TypeAvantage parseRequiredTypeAvantage(String value) {
        TypeAvantage type = parseTypeAvantage(value);
        if (type == null) {
            throw new IllegalArgumentException("Type d'avantage requis.");
        }
        return type;
    }

    private void updateConventionFields(Convention convention, ConventionRequest request) {
        TypeAvantage type = request.getTypeAvantage() == null
                ? convention.getTypeAvantage()
                : parseRequiredTypeAvantage(request.getTypeAvantage());
        ConventionFields merged = validateConventionFields(
                request.getPourcentageAdherent() != null ? request.getPourcentageAdherent() : convention.getPourcentageAdherent(),
                request.getMontantAvantage() != null ? request.getMontantAvantage() : convention.getMontantAvantage(),
                request.getNombreMoisRetenue() != null ? request.getNombreMoisRetenue() : convention.getNombreMoisRetenue(),
                request.getQuantiteDisponible() != null ? request.getQuantiteDisponible() : convention.getQuantiteDisponible(),
                type);
        convention.setTypeAvantage(type);
        convention.setPourcentageAdherent(merged.pourcentageAdherent());
        convention.setMontantAvantage(merged.montantAvantage());
        convention.setNombreMoisRetenue(merged.nombreMoisRetenue());
        convention.setQuantiteDisponible(merged.quantiteDisponible());
        if (request.getAutoriseAyantsDroit() != null) {
            convention.setAutoriseAyantsDroit(request.getAutoriseAyantsDroit());
        }
        if (request.getDocumentConventionId() != null) {
            convention.setDocumentConvention(requireAttachment(request.getDocumentConventionId()));
        }
    }

    private static ConventionFields validateConventionFields(ConventionRequest request, TypeAvantage type) {
        return validateConventionFields(
                request.getPourcentageAdherent(),
                request.getMontantAvantage(),
                request.getNombreMoisRetenue(),
                request.getQuantiteDisponible(),
                type);
    }

    private static ConventionFields validateConventionFields(
            Double pourcentageAdherent,
            Double montantAvantage,
            Integer nombreMoisRetenue,
            Integer quantiteDisponible,
            TypeAvantage type) {
        if (quantiteDisponible != null && quantiteDisponible < 0) {
            throw new IllegalArgumentException("Quantite disponible invalide.");
        }
        if (type == null) {
            return new ConventionFields(pourcentageAdherent, montantAvantage, nombreMoisRetenue, quantiteDisponible);
        }
        return switch (type) {
            case REMISE_DIRECTE -> new ConventionFields(0d, null, null, quantiteDisponible);
            case BON_ACHAT, ABONNEMENT -> {
                validateSplit(pourcentageAdherent);
                validatePositiveAmount(montantAvantage, "Montant d'avantage");
                yield new ConventionFields(pourcentageAdherent, montantAvantage, null, quantiteDisponible);
            }
            case ACHAT_TRANCHE -> {
                validateSplit(pourcentageAdherent);
                validatePositiveAmount(montantAvantage, "Montant d'achat");
                if (nombreMoisRetenue == null || nombreMoisRetenue <= 0) {
                    throw new IllegalArgumentException("Nombre de mois de retenue requis pour un achat tranche.");
                }
                yield new ConventionFields(pourcentageAdherent, montantAvantage, nombreMoisRetenue, quantiteDisponible);
            }
        };
    }

    private static void validateSplit(Double value) {
        if (value == null || value < 0 || value > 100) {
            throw new IllegalArgumentException("Pourcentage adherent invalide (0 - 100).");
        }
    }

    private static void validatePositiveAmount(Double value, String label) {
        if (value == null || value <= 0) {
            throw new IllegalArgumentException(label + " requis (> 0).");
        }
    }

    private static LocalDate parseDate(String value, String label) {
        return DateParser.parseIsoDate(value, label);
    }

    private static void validateDateRange(LocalDate debut, LocalDate fin) {
        if (!fin.isAfter(debut)) {
            throw new IllegalArgumentException("La date de fin doit etre apres la date de debut.");
        }
    }

    private static void validateRemise(Double remise) {
        if (remise != null && (remise < 0 || remise > 100)) {
            throw new IllegalArgumentException("Remise invalide (0 - 100).");
        }
    }

    private static Long parseRequiredFournisseurId(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Le fournisseur est requis.");
        }
        return parseFournisseurId(value);
    }

    private static Long parseFournisseurId(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID de fournisseur invalide.");
        }
    }

    private Fournisseur requireFournisseur(Long id) {
        return Repos.findOrThrow(fournisseurRepository, id, "Fournisseur");
    }

    private Convention requireConvention(Long id) {
        return Repos.findOrThrow(conventionRepository, id, "Convention");
    }

    private Attachment requireAttachment(Long id) {
        return Repos.findOrThrow(attachmentRepository, id, "Document");
    }

    private record ConventionFields(
            Double pourcentageAdherent,
            Double montantAvantage,
            Integer nombreMoisRetenue,
            Integer quantiteDisponible) {
    }
}
