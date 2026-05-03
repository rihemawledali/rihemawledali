package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.CompteBancaireDto;
import com.project_pfe_srt.project_srt.dto.CompteBancaireRequest;
import com.project_pfe_srt.project_srt.entity.CompteBancaire;
import com.project_pfe_srt.project_srt.repository.CompteBancaireRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CompteBancaireService {

    private static final Set<String> DEVISES = Set.of("TND", "EUR", "USD");

    private final CompteBancaireRepository repo;

    public List<CompteBancaireDto> list() {
        return repo.findAllByOrderByIdAsc().stream().map(CompteBancaireDto::from).toList();
    }

    public CompteBancaireDto create(CompteBancaireRequest req) {
        if (req.getBanque() == null || req.getBanque().isBlank())
            throw new IllegalArgumentException("Banque requise.");
        if (req.getIban() == null || req.getIban().isBlank())
            throw new IllegalArgumentException("IBAN requis.");
        String dev = req.getDevise() == null ? "TND" : req.getDevise().toUpperCase();
        if (!DEVISES.contains(dev)) throw new IllegalArgumentException("Devise invalide.");
        double solde = req.getSolde() == null ? 0d : req.getSolde();
        if (solde < 0) throw new IllegalArgumentException("Solde négatif interdit.");

        CompteBancaire c = CompteBancaire.builder()
                .banque(req.getBanque().trim())
                .iban(req.getIban().trim())
                .solde(solde)
                .devise(dev)
                .build();
        return CompteBancaireDto.from(repo.save(c));
    }

    public CompteBancaireDto update(Long id, CompteBancaireRequest req) {
        CompteBancaire c = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Compte bancaire introuvable."));
        if (req.getBanque() != null) c.setBanque(req.getBanque());
        if (req.getIban() != null) c.setIban(req.getIban());
        if (req.getSolde() != null) {
            if (req.getSolde() < 0) throw new IllegalArgumentException("Solde négatif interdit.");
            c.setSolde(req.getSolde());
        }
        if (req.getDevise() != null) {
            String dev = req.getDevise().toUpperCase();
            if (!DEVISES.contains(dev)) throw new IllegalArgumentException("Devise invalide.");
            c.setDevise(dev);
        }
        return CompteBancaireDto.from(repo.save(c));
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) throw new IllegalArgumentException("Compte bancaire introuvable.");
        repo.deleteById(id);
    }
}
