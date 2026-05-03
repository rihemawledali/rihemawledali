package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.BonCommandeDto;
import com.project_pfe_srt.project_srt.dto.BonCommandeRequest;
import com.project_pfe_srt.project_srt.entity.BonCommande;
import com.project_pfe_srt.project_srt.entity.Fournisseur;
import com.project_pfe_srt.project_srt.entity.Role;
import com.project_pfe_srt.project_srt.entity.User;
import com.project_pfe_srt.project_srt.repository.BonCommandeRepository;
import com.project_pfe_srt.project_srt.repository.FournisseurRepository;
import com.project_pfe_srt.project_srt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BonCommandeService {

    private static final Set<String> STATUTS = Set.of("en_attente", "attribue", "utilise", "expire");

    private final BonCommandeRepository repo;
    private final FournisseurRepository fournisseurRepository;
    private final UserRepository userRepository;

    public List<BonCommandeDto> list() {
        return repo.findAllByOrderByDateEmissionDesc().stream()
                .map(BonCommandeDto::from).toList();
    }

    private static String requireStatut(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        String v = value.trim().toLowerCase();
        if (!STATUTS.contains(v)) throw new IllegalArgumentException("Statut invalide.");
        return v;
    }

    private static LocalDate parseDate(String v, String label) {
        if (v == null || v.isBlank()) throw new IllegalArgumentException(label + " requise.");
        try {
            return LocalDate.parse(v.length() > 10 ? v.substring(0, 10) : v);
        } catch (Exception e) {
            throw new IllegalArgumentException(label + " invalide.");
        }
    }

    public BonCommandeDto create(BonCommandeRequest req) {
        if (req.getNumero() == null || req.getNumero().isBlank())
            throw new IllegalArgumentException("Numéro requis.");
        if (repo.existsByNumero(req.getNumero()))
            throw new IllegalArgumentException("Numéro déjà utilisé.");
        if (req.getMontant() == null || req.getMontant() <= 0)
            throw new IllegalArgumentException("Montant invalide.");
        if (req.getFournisseurId() == null)
            throw new IllegalArgumentException("Fournisseur requis.");

        Fournisseur f = fournisseurRepository.findById(req.getFournisseurId())
                .orElseThrow(() -> new IllegalArgumentException("Fournisseur introuvable."));

        User adherent = null;
        if (req.getAdherentId() != null) {
            adherent = userRepository.findById(req.getAdherentId())
                    .orElseThrow(() -> new IllegalArgumentException("Adhérent introuvable."));
            if (adherent.getRole() != Role.ADHERENT) {
                throw new IllegalArgumentException("L'utilisateur sélectionné n'est pas un adhérent.");
            }
        }

        LocalDate emission = parseDate(req.getDateEmission(), "Date d'émission");
        LocalDate expiration = parseDate(req.getDateExpiration(), "Date d'expiration");
        if (expiration.isBefore(emission)) {
            throw new IllegalArgumentException("La date d'expiration doit être après la date d'émission.");
        }

        BonCommande b = BonCommande.builder()
                .numero(req.getNumero().trim())
                .fournisseur(f)
                .adherent(adherent)
                .montant(req.getMontant())
                .statut(requireStatut(req.getStatut(), "en_attente"))
                .dateEmission(emission)
                .dateExpiration(expiration)
                .build();
        return BonCommandeDto.from(repo.save(b));
    }

    public BonCommandeDto update(Long id, BonCommandeRequest req) {
        BonCommande b = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bon de commande introuvable."));

        if (req.getNumero() != null && !req.getNumero().equalsIgnoreCase(b.getNumero())) {
            if (repo.existsByNumero(req.getNumero()))
                throw new IllegalArgumentException("Numéro déjà utilisé.");
            b.setNumero(req.getNumero());
        }
        if (req.getFournisseurId() != null) {
            Fournisseur f = fournisseurRepository.findById(req.getFournisseurId())
                    .orElseThrow(() -> new IllegalArgumentException("Fournisseur introuvable."));
            b.setFournisseur(f);
        }
        if (req.getAdherentId() != null) {
            User a = userRepository.findById(req.getAdherentId())
                    .orElseThrow(() -> new IllegalArgumentException("Adhérent introuvable."));
            b.setAdherent(a);
        }
        if (req.getMontant() != null) {
            if (req.getMontant() <= 0) throw new IllegalArgumentException("Montant invalide.");
            b.setMontant(req.getMontant());
        }
        if (req.getStatut() != null) b.setStatut(requireStatut(req.getStatut(), b.getStatut()));
        if (req.getDateEmission() != null) b.setDateEmission(parseDate(req.getDateEmission(), "Date d'émission"));
        if (req.getDateExpiration() != null) b.setDateExpiration(parseDate(req.getDateExpiration(), "Date d'expiration"));

        return BonCommandeDto.from(repo.save(b));
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) throw new IllegalArgumentException("Bon de commande introuvable.");
        repo.deleteById(id);
    }
}
