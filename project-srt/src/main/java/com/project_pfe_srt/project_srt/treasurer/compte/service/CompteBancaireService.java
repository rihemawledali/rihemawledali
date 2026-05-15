package com.project_pfe_srt.project_srt.treasurer.compte.service;

import com.project_pfe_srt.project_srt.common.exception.NotFoundException;
import com.project_pfe_srt.project_srt.common.util.Repos;
import com.project_pfe_srt.project_srt.common.util.Validators;
import com.project_pfe_srt.project_srt.shared.tresorerie.dto.CompteBancaireDto;
import com.project_pfe_srt.project_srt.shared.tresorerie.dto.CompteBancaireRequest;
import com.project_pfe_srt.project_srt.shared.tresorerie.dto.DepotManuelRequest;
import com.project_pfe_srt.project_srt.shared.tresorerie.dto.HistoriqueTresorerieDto;
import com.project_pfe_srt.project_srt.shared.tresorerie.entity.CompteBancaire;
import com.project_pfe_srt.project_srt.shared.tresorerie.repository.CompteBancaireRepository;
import com.project_pfe_srt.project_srt.shared.tresorerie.service.TreasuryLedger;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CompteBancaireService {

    private static final Set<String> DEVISES = Set.of("TND", "EUR", "USD");
    private static final String DEFAULT_DEVISE = "TND";

    private final CompteBancaireRepository repo;
    private final TreasuryLedger ledger;

    public List<CompteBancaireDto> list() {
        return repo.findAllByOrderByIdAsc().stream().map(CompteBancaireDto::from).toList();
    }

    public CompteBancaireDto create(CompteBancaireRequest req) {
        String banque = Validators.requireNonBlank(req.getBanque(), "Banque");
        String iban = Validators.requireNonBlank(req.getIban(), "IBAN");
        String devise = req.getDevise() == null
                ? DEFAULT_DEVISE
                : Validators.requireOneOf(DEVISES, req.getDevise().toUpperCase(), "Devise");
        double solde = req.getSolde() == null ? 0d : requireNonNegative(req.getSolde());

        CompteBancaire c = CompteBancaire.builder()
                .banque(banque)
                .iban(iban)
                .solde(solde)
                .devise(devise)
                .build();
        return CompteBancaireDto.from(repo.save(c));
    }

    public CompteBancaireDto update(Long id, CompteBancaireRequest req) {
        CompteBancaire c = Repos.findOrThrow(repo, id, "Compte bancaire");
        if (req.getBanque() != null) c.setBanque(req.getBanque());
        if (req.getIban() != null) c.setIban(req.getIban());
        if (req.getSolde() != null) c.setSolde(requireNonNegative(req.getSolde()));
        if (req.getDevise() != null) {
            c.setDevise(Validators.requireOneOf(DEVISES, req.getDevise().toUpperCase(), "Devise"));
        }
        return CompteBancaireDto.from(repo.save(c));
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) throw NotFoundException.of("Compte bancaire");
        repo.deleteById(id);
    }

    @Transactional
    public HistoriqueTresorerieDto deposerManuellement(Long compteId, DepotManuelRequest req, String userName) {
        Validators.requirePositive(req.getMontant(), "Montant");
        String description = req.getDescription() == null || req.getDescription().isBlank()
                ? "Versement manuel" : req.getDescription();
        String ref = "DEP-" + System.currentTimeMillis();
        var h = ledger.applyEntree(compteId, req.getMontant(), "VERSEMENT_MANUEL",
                null, null, description, ref, userName);
        return HistoriqueTresorerieDto.from(h);
    }

    // ---- helpers --------------------------------------------------------

    private static double requireNonNegative(Double value) {
        if (value < 0) throw new IllegalArgumentException("Solde négatif interdit.");
        return value;
    }
}
