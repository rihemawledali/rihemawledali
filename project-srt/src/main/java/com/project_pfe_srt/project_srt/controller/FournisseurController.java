package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.dto.FournisseurDto;
import com.project_pfe_srt.project_srt.dto.FournisseurRequest;
import com.project_pfe_srt.project_srt.entity.Fournisseur;
import com.project_pfe_srt.project_srt.repository.ConventionRepository;
import com.project_pfe_srt.project_srt.repository.FournisseurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/fournisseurs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class FournisseurController {

    private static final Set<String> CATEGORIES = Set.of(
            "sante", "restauration", "transport", "loisir", "commerce", "education");
    private static final Set<String> STATUSES = Set.of("actif", "inactif");

    private final FournisseurRepository fournisseurRepository;
    private final ConventionRepository conventionRepository;

    private static String requireCategorie(String value) {
        if (value == null) throw new IllegalArgumentException("La catégorie est requise.");
        String v = value.trim().toLowerCase();
        if (!CATEGORIES.contains(v)) {
            throw new IllegalArgumentException("Catégorie invalide.");
        }
        return v;
    }

    private static String requireStatus(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        String v = value.trim().toLowerCase();
        if (!STATUSES.contains(v)) {
            throw new IllegalArgumentException("Statut invalide.");
        }
        return v;
    }

    @GetMapping
    public ResponseEntity<List<FournisseurDto>> list() {
        return ResponseEntity.ok(
                fournisseurRepository.findAll().stream().map(FournisseurDto::from).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return fournisseurRepository.findById(id)
                .<ResponseEntity<?>>map(f -> ResponseEntity.ok(FournisseurDto.from(f)))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Fournisseur introuvable.")));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody FournisseurRequest req) {
        try {
            if (req.getNom() == null || req.getNom().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le nom est requis."));
            }
            Fournisseur f = Fournisseur.builder()
                    .nom(req.getNom())
                    .adresse(req.getAdresse())
                    .telephone(req.getTelephone())
                    .email(req.getEmail())
                    .categorie(requireCategorie(req.getCategorie()))
                    .status(requireStatus(req.getStatus(), "actif"))
                    .build();
            fournisseurRepository.save(f);
            return ResponseEntity.ok(FournisseurDto.from(f));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody FournisseurRequest req) {
        return fournisseurRepository.findById(id)
                .<ResponseEntity<?>>map(f -> {
                    try {
                        if (req.getNom() != null) f.setNom(req.getNom());
                        if (req.getAdresse() != null) f.setAdresse(req.getAdresse());
                        if (req.getTelephone() != null) f.setTelephone(req.getTelephone());
                        if (req.getEmail() != null) f.setEmail(req.getEmail());
                        if (req.getCategorie() != null) f.setCategorie(requireCategorie(req.getCategorie()));
                        if (req.getStatus() != null) f.setStatus(requireStatus(req.getStatus(), f.getStatus()));
                        fournisseurRepository.save(f);
                        return ResponseEntity.ok(FournisseurDto.from(f));
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
                    }
                })
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Fournisseur introuvable.")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!fournisseurRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("error", "Fournisseur introuvable."));
        }
        if (conventionRepository.existsByFournisseurId(id)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Impossible de supprimer : ce fournisseur a des conventions associées."));
        }
        fournisseurRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Fournisseur supprimé."));
    }
}
