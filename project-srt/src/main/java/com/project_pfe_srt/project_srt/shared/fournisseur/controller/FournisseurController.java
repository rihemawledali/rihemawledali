package com.project_pfe_srt.project_srt.shared.fournisseur.controller;

import com.project_pfe_srt.project_srt.common.util.Repos;
import com.project_pfe_srt.project_srt.common.util.Validators;
import com.project_pfe_srt.project_srt.shared.convention.repository.ConventionRepository;
import com.project_pfe_srt.project_srt.shared.fournisseur.dto.FournisseurDto;
import com.project_pfe_srt.project_srt.shared.fournisseur.dto.FournisseurRequest;
import com.project_pfe_srt.project_srt.shared.fournisseur.entity.Fournisseur;
import com.project_pfe_srt.project_srt.shared.fournisseur.repository.FournisseurRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/fournisseurs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TRESORIER')")
public class FournisseurController {

    private static final Set<String> CATEGORIES = Set.of(
            "sante", "restauration", "transport", "loisir", "commerce", "education");
    private static final Set<String> STATUSES = Set.of("actif", "inactif");

    private final FournisseurRepository fournisseurRepository;
    private final ConventionRepository conventionRepository;

    @GetMapping
    public List<FournisseurDto> list() {
        return fournisseurRepository.findAll().stream().map(FournisseurDto::from).toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public FournisseurDto create(@RequestBody FournisseurRequest req) {
        String nom = Validators.requireNonBlank(req.getNom(), "Nom");
        Fournisseur f = Fournisseur.builder()
                .nom(nom)
                .adresse(req.getAdresse())
                .telephone(req.getTelephone())
                .email(req.getEmail())
                .categorie(requireCategorie(req.getCategorie()))
                .status(requireStatus(req.getStatus(), "actif"))
                .build();
        return FournisseurDto.from(fournisseurRepository.save(f));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public FournisseurDto update(@PathVariable Long id, @RequestBody FournisseurRequest req) {
        Fournisseur f = Repos.findOrThrow(fournisseurRepository, id, "Fournisseur");
        if (req.getNom() != null) f.setNom(req.getNom());
        if (req.getAdresse() != null) f.setAdresse(req.getAdresse());
        if (req.getTelephone() != null) f.setTelephone(req.getTelephone());
        if (req.getEmail() != null) f.setEmail(req.getEmail());
        if (req.getCategorie() != null) f.setCategorie(requireCategorie(req.getCategorie()));
        if (req.getStatus() != null) f.setStatus(requireStatus(req.getStatus(), f.getStatus()));
        return FournisseurDto.from(fournisseurRepository.save(f));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> delete(@PathVariable Long id) {
        Fournisseur f = Repos.findOrThrow(fournisseurRepository, id, "Fournisseur");
        if (conventionRepository.existsByFournisseurId(f.getId())) {
            throw new IllegalArgumentException(
                    "Impossible de supprimer : ce fournisseur a des conventions associées.");
        }
        fournisseurRepository.delete(f);
        return Map.of("message", "Fournisseur supprimé.");
    }

    // ---- helpers --------------------------------------------------------

    private static String requireCategorie(String value) {
        return Validators.requireOneOfLower(CATEGORIES, value, "Catégorie");
    }

    private static String requireStatus(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        return Validators.requireOneOfLower(STATUSES, value, "Statut");
    }
}
