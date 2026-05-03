package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.entity.CompteBancaire;
import com.project_pfe_srt.project_srt.entity.HistoriqueTresorerie;
import com.project_pfe_srt.project_srt.repository.CompteBancaireRepository;
import com.project_pfe_srt.project_srt.repository.HistoriqueTresorerieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Encapsulates every treasury side-effect: solde mutations + historique
 * line generation. All other services delegate to it so the rules live
 * in a single place.
 *
 * Convention: amounts passed to {@link #applyEntree} and {@link #applySortie}
 * are always **positive**. The historique row stores the *signed* value.
 */
@Service
@RequiredArgsConstructor
public class TreasuryLedger {

    private final CompteBancaireRepository compteRepository;
    private final HistoriqueTresorerieRepository historiqueRepository;

    /** Returns the first compte bancaire (lowest id), or {@code null} if none. */
    public CompteBancaire primaryCompte() {
        List<CompteBancaire> all = compteRepository.findAllByOrderByIdAsc();
        return all.isEmpty() ? null : all.get(0);
    }

    /** Sum of all comptes soldes. */
    public double soldeTotal() {
        return compteRepository.findAll().stream()
                .mapToDouble(c -> c.getSolde() == null ? 0d : c.getSolde())
                .sum();
    }

    /**
     * Records a SORTIE: debits the primary compte and pushes a negative
     * historique row.
     */
    @Transactional
    public HistoriqueTresorerie applySortie(double amount,
                                            String sourceType,
                                            Long sourceRefId,
                                            String description,
                                            String reference,
                                            String modePaiement,
                                            String statut,
                                            String utilisateur) {
        double abs = Math.abs(amount);
        CompteBancaire c = primaryCompte();
        if (c != null) {
            double current = c.getSolde() == null ? 0d : c.getSolde();
            c.setSolde(Math.max(0d, current - abs));
            compteRepository.save(c);
        }
        return historiqueRepository.save(HistoriqueTresorerie.builder()
                .type("sortie")
                .sourceType(sourceType)
                .sourceRefId(sourceRefId)
                .description(description)
                .montant(-abs)
                .date(LocalDateTime.now())
                .reference(reference)
                .modePaiement(modePaiement)
                .statut(statut)
                .utilisateur(utilisateur)
                .build());
    }

    /**
     * Records an ENTREE: credits the primary compte and pushes a positive
     * historique row.
     */
    @Transactional
    public HistoriqueTresorerie applyEntree(double amount,
                                            String sourceType,
                                            Long sourceRefId,
                                            String description,
                                            String reference,
                                            String utilisateur) {
        double abs = Math.abs(amount);
        CompteBancaire c = primaryCompte();
        if (c != null) {
            double current = c.getSolde() == null ? 0d : c.getSolde();
            c.setSolde(current + abs);
            compteRepository.save(c);
        }
        return historiqueRepository.save(HistoriqueTresorerie.builder()
                .type("entree")
                .sourceType(sourceType)
                .sourceRefId(sourceRefId)
                .description(description)
                .montant(abs)
                .date(LocalDateTime.now())
                .reference(reference)
                .utilisateur(utilisateur)
                .build());
    }

    /**
     * Reverses a previously-recorded historique row by reference: re-credits
     * (or re-debits) the compte and removes the historique line.
     * No-op if the reference is not found.
     */
    @Transactional
    public void reverseByReference(String reference) {
        if (reference == null) return;
        var rows = historiqueRepository.findAll().stream()
                .filter(h -> reference.equals(h.getReference()))
                .toList();
        if (rows.isEmpty()) return;

        CompteBancaire c = primaryCompte();
        for (HistoriqueTresorerie h : rows) {
            if (c != null && h.getMontant() != null) {
                double current = c.getSolde() == null ? 0d : c.getSolde();
                // h.montant is signed; reversing means subtracting it.
                c.setSolde(Math.max(0d, current - h.getMontant()));
            }
            historiqueRepository.delete(h);
        }
        if (c != null) compteRepository.save(c);
    }
}
