package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.dto.ConventionDto;
import com.project_pfe_srt.project_srt.dto.ConventionRequest;
import com.project_pfe_srt.project_srt.entity.Convention;
import com.project_pfe_srt.project_srt.entity.Fournisseur;
import com.project_pfe_srt.project_srt.repository.ConventionRepository;
import com.project_pfe_srt.project_srt.repository.FournisseurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/conventions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ConventionController {

    private static final Set<String> TYPES = Set.of(
            "sante", "restauration", "transport", "loisir", "commerce", "education");
    private static final Set<String> STATUTS = Set.of(
            "active", "expiree", "en_negociation", "suspendue");

    private final ConventionRepository conventionRepository;
    private final FournisseurRepository fournisseurRepository;

    private static String requireType(String v) {
        if (v == null) throw new IllegalArgumentException("Le type est requis.");
        String s = v.trim().toLowerCase();
        if (!TYPES.contains(s)) throw new IllegalArgumentException("Type invalide.");
        return s;
    }

    private static String requireStatut(String v, String fallback) {
        if (v == null || v.isBlank()) return fallback;
        String s = v.trim().toLowerCase();
        if (!STATUTS.contains(s)) throw new IllegalArgumentException("Statut invalide.");
        return s;
    }

    /** Accepts ISO date or ISO datetime; returns LocalDate. */
    private static LocalDate parseDate(String v, String label) {
        if (v == null || v.isBlank()) {
            throw new IllegalArgumentException("La date " + label + " est requise.");
        }
        try {
            // Strip time portion if present (e.g. 2026-01-01T00:00:00.000Z -> 2026-01-01)
            String trimmed = v.length() >= 10 ? v.substring(0, 10) : v;
            return LocalDate.parse(trimmed);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Date " + label + " invalide.");
        }
    }

    @GetMapping
    public ResponseEntity<List<ConventionDto>> list() {
        return ResponseEntity.ok(
                conventionRepository.findAll().stream().map(ConventionDto::from).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return conventionRepository.findById(id)
                .<ResponseEntity<?>>map(c -> ResponseEntity.ok(ConventionDto.from(c)))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Convention introuvable.")));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ConventionRequest req) {
        try {
            if (req.getFournisseurId() == null || req.getFournisseurId().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le fournisseur est requis."));
            }
            Long fid;
            try { fid = Long.parseLong(req.getFournisseurId()); }
            catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "ID de fournisseur invalide."));
            }
            Fournisseur fournisseur = fournisseurRepository.findById(fid).orElse(null);
            if (fournisseur == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Fournisseur introuvable."));
            }
            if (req.getRemise() == null || req.getRemise() < 0 || req.getRemise() > 100) {
                return ResponseEntity.badRequest().body(Map.of("error", "Remise invalide (0 - 100)."));
            }
            LocalDate debut = parseDate(req.getDateDebut(), "de début");
            LocalDate fin = parseDate(req.getDateFin(), "de fin");
            if (!fin.isAfter(debut)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "La date de fin doit être après la date de début."));
            }

            Convention c = Convention.builder()
                    .fournisseur(fournisseur)
                    .type(requireType(req.getType()))
                    .dateDebut(debut)
                    .dateFin(fin)
                    .remise(req.getRemise())
                    .statut(requireStatut(req.getStatut(), "active"))
                    .description(req.getDescription())
                    .build();
            conventionRepository.save(c);
            return ResponseEntity.ok(ConventionDto.from(c));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody ConventionRequest req) {
        return conventionRepository.findById(id)
                .<ResponseEntity<?>>map(c -> {
                    try {
                        if (req.getFournisseurId() != null && !req.getFournisseurId().isBlank()) {
                            Long fid = Long.parseLong(req.getFournisseurId());
                            Fournisseur f = fournisseurRepository.findById(fid).orElse(null);
                            if (f == null) {
                                return ResponseEntity.badRequest().body(Map.of("error", "Fournisseur introuvable."));
                            }
                            c.setFournisseur(f);
                        }
                        if (req.getType() != null) c.setType(requireType(req.getType()));
                        if (req.getDateDebut() != null) c.setDateDebut(parseDate(req.getDateDebut(), "de début"));
                        if (req.getDateFin() != null) c.setDateFin(parseDate(req.getDateFin(), "de fin"));
                        if (req.getRemise() != null) {
                            if (req.getRemise() < 0 || req.getRemise() > 100) {
                                return ResponseEntity.badRequest().body(Map.of("error", "Remise invalide (0 - 100)."));
                            }
                            c.setRemise(req.getRemise());
                        }
                        if (req.getStatut() != null) c.setStatut(requireStatut(req.getStatut(), c.getStatut()));
                        if (req.getDescription() != null) c.setDescription(req.getDescription());
                        if (!c.getDateFin().isAfter(c.getDateDebut())) {
                            return ResponseEntity.badRequest().body(Map.of(
                                    "error", "La date de fin doit être après la date de début."));
                        }
                        conventionRepository.save(c);
                        return ResponseEntity.ok(ConventionDto.from(c));
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", "ID de fournisseur invalide."));
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
                    }
                })
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Convention introuvable.")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!conventionRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("error", "Convention introuvable."));
        }
        conventionRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Convention supprimée."));
    }
}
