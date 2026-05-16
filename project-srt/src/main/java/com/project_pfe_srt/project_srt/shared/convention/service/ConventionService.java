package com.project_pfe_srt.project_srt.shared.convention.service;

import com.project_pfe_srt.project_srt.common.exception.NotFoundException;
import com.project_pfe_srt.project_srt.common.util.DateParser;
import com.project_pfe_srt.project_srt.common.util.Repos;
import com.project_pfe_srt.project_srt.common.util.Validators;
import com.project_pfe_srt.project_srt.shared.convention.dto.ConventionDto;
import com.project_pfe_srt.project_srt.shared.convention.dto.ConventionRequest;
import com.project_pfe_srt.project_srt.shared.convention.entity.Convention;
import com.project_pfe_srt.project_srt.shared.convention.entity.ModeAvantage;
import com.project_pfe_srt.project_srt.shared.convention.repository.ConventionRepository;
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
        LocalDate debut = parseDate(request.getDateDebut(), "de début");
        LocalDate fin = parseDate(request.getDateFin(), "de fin");
        validateDateRange(debut, fin);

        ModeAvantage mode = parseModeAvantage(request.getModeAvantage());
        if (mode == null) {
            throw new IllegalArgumentException("Mode d'avantage requis.");
        }
        AvantageFields avantage = validateAvantageFields(request, mode);

        Convention convention = Convention.builder()
                .fournisseur(fournisseur)
                .type(requireType(request.getType()))
                .dateDebut(debut)
                .dateFin(fin)
                .remise(request.getRemise())
                .statut(requireStatut(request.getStatut(), "active"))
                .description(request.getDescription())
                .typeConvention(request.getTypeConvention())
                .modeAvantage(mode)
                .tauxReduction(avantage.tauxReduction())
                .montantReduction(avantage.montantReduction())
                .descriptionAvantage(avantage.descriptionAvantage())
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
            convention.setDateDebut(parseDate(request.getDateDebut(), "de début"));
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

        updateAvantageFields(convention, request);
        validateDateRange(convention.getDateDebut(), convention.getDateFin());

        return ConventionDto.from(convention);
    }

    @Transactional
    public Map<String, String> delete(Long id) {
        if (!conventionRepository.existsById(id)) {
            throw NotFoundException.of("Convention");
        }
        conventionRepository.deleteById(id);
        return Map.of("message", "Convention supprimée.");
    }

    public static String requireType(String value) {
        return Validators.requireOneOfLower(TYPES, value, "Type");
    }

    public static String requireStatut(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        return Validators.requireOneOfLower(STATUTS, value, "Statut");
    }

    public static ModeAvantage parseModeAvantage(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return ModeAvantage.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Mode d'avantage invalide.");
        }
    }

    private void updateAvantageFields(Convention convention, ConventionRequest request) {
        if (request.getModeAvantage() != null) {
            ModeAvantage mode = parseModeAvantage(request.getModeAvantage());
            AvantageFields merged = validateAvantageFields(
                    request.getTauxReduction() != null ? request.getTauxReduction() : convention.getTauxReduction(),
                    request.getMontantReduction() != null ? request.getMontantReduction() : convention.getMontantReduction(),
                    request.getDescriptionAvantage() != null ? request.getDescriptionAvantage() : convention.getDescriptionAvantage(),
                    mode);
            convention.setModeAvantage(mode);
            convention.setTauxReduction(merged.tauxReduction());
            convention.setMontantReduction(merged.montantReduction());
            convention.setDescriptionAvantage(merged.descriptionAvantage());
            return;
        }

        if (request.getTauxReduction() != null) {
            convention.setTauxReduction(request.getTauxReduction());
        }
        if (request.getMontantReduction() != null) {
            convention.setMontantReduction(request.getMontantReduction());
        }
        if (request.getDescriptionAvantage() != null) {
            convention.setDescriptionAvantage(request.getDescriptionAvantage());
        }
    }

    private static AvantageFields validateAvantageFields(ConventionRequest request, ModeAvantage mode) {
        return validateAvantageFields(
                request.getTauxReduction(),
                request.getMontantReduction(),
                request.getDescriptionAvantage(),
                mode);
    }

    private static AvantageFields validateAvantageFields(
            Double tauxReduction,
            Double montantReduction,
            String descriptionAvantage,
            ModeAvantage mode) {

        if (mode == null) {
            return new AvantageFields(tauxReduction, montantReduction, descriptionAvantage);
        }
        return switch (mode) {
            case REMISE_POURCENTAGE -> {
                if (tauxReduction == null || tauxReduction <= 0 || tauxReduction > 100) {
                    throw new IllegalArgumentException("Taux de reduction requis (0-100) pour une remise en pourcentage.");
                }
                yield new AvantageFields(tauxReduction, null, descriptionAvantage);
            }
            case REMISE_MONTANT_FIXE, SUBVENTION_AMICALE -> {
                if (montantReduction == null || montantReduction <= 0) {
                    throw new IllegalArgumentException("Montant de reduction requis (> 0) pour ce mode d'avantage.");
                }
                yield new AvantageFields(null, montantReduction, descriptionAvantage);
            }
            case PRIX_NEGOCIE, AUTRE -> {
                if (descriptionAvantage == null || descriptionAvantage.isBlank()) {
                    throw new IllegalArgumentException("Description de l'avantage requise pour ce mode.");
                }
                yield new AvantageFields(null, null, descriptionAvantage);
            }
        };
    }

    private static LocalDate parseDate(String value, String label) {
        return DateParser.parseIsoDate(value, label);
    }

    private static void validateDateRange(LocalDate debut, LocalDate fin) {
        if (!fin.isAfter(debut)) {
            throw new IllegalArgumentException("La date de fin doit être après la date de début.");
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

    private record AvantageFields(
            Double tauxReduction,
            Double montantReduction,
            String descriptionAvantage) {
    }
}
