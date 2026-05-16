package com.project_pfe_srt.project_srt.shared.tresorerie.service;

import com.project_pfe_srt.project_srt.shared.convention.entity.Convention;
import com.project_pfe_srt.project_srt.shared.tresorerie.entity.CompteBancaire;
import com.project_pfe_srt.project_srt.shared.tresorerie.entity.HistoriqueTresorerie;
import com.project_pfe_srt.project_srt.shared.tresorerie.repository.CompteBancaireRepository;
import com.project_pfe_srt.project_srt.shared.tresorerie.repository.HistoriqueTresorerieRepository;

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
        return compteRepository.findAllByOrderByIdAsc().stream()
                .mapToDouble(c -> c.getSolde() == null ? 0d : c.getSolde())
                .sum();
    }

    /** Looks up a compte by id, or falls back to {@link #primaryCompte()}. */
    public CompteBancaire resolveCompte(Long compteBancaireId) {
        if (compteBancaireId != null) {
            return compteRepository.findById(compteBancaireId)
                    .orElseThrow(() -> new IllegalArgumentException("Compte bancaire introuvable: " + compteBancaireId));
        }
        CompteBancaire c = primaryCompte();
        if (c == null) throw new IllegalArgumentException("Aucun compte bancaire configuré.");
        return c;
    }

    /**
     * Records a SORTIE: debits the selected compte and pushes a negative
     * historique row. Throws if balance is insufficient.
     */
    @Transactional
    public HistoriqueTresorerie applySortie(Long compteBancaireId,
                                            double amount,
                                            String typeOperation,
                                            String sourceType,
                                            Long sourceRefId,
                                            String description,
                                            String reference,
                                            String modePaiement,
                                            String statut,
                                            String utilisateur) {
        double abs = requirePositiveAmount(amount);
        CompteBancaire c = resolveRequiredCompte(compteBancaireId);
        double current = c.getSolde() == null ? 0d : c.getSolde();
        if (current < abs) {
            throw new IllegalArgumentException(
                    "Solde insuffisant sur le compte " + c.getBanque()
                    + " (solde: " + current + ", requis: " + abs + ").");
        }
        c.setSolde(current - abs);
        compteRepository.save(c);

        return historiqueRepository.save(HistoriqueTresorerie.builder()
                .type("sortie")
                .typeOperation(typeOperation)
                .sourceType(sourceType)
                .sourceRefId(sourceRefId)
                .description(description)
                .montant(-abs)
                .date(LocalDateTime.now())
                .reference(reference)
                .modePaiement(modePaiement)
                .statut(statut)
                .utilisateur(utilisateur)
                .compteBancaire(c)
                .build());
    }

    /**
     * Records an ENTREE: credits the selected compte and pushes a positive
     * historique row.
     */
    @Transactional
    public HistoriqueTresorerie applyEntree(Long compteBancaireId,
                                            double amount,
                                            String typeOperation,
                                            String sourceType,
                                            Long sourceRefId,
                                            String description,
                                            String reference,
                                            String utilisateur) {
        double abs = requirePositiveAmount(amount);
        CompteBancaire c = resolveRequiredCompte(compteBancaireId);
        double current = c.getSolde() == null ? 0d : c.getSolde();
        c.setSolde(current + abs);
        compteRepository.save(c);

        return historiqueRepository.save(HistoriqueTresorerie.builder()
                .type("entree")
                .typeOperation(typeOperation)
                .sourceType(sourceType)
                .sourceRefId(sourceRefId)
                .description(description)
                .montant(abs)
                .date(LocalDateTime.now())
                .reference(reference)
                .utilisateur(utilisateur)
                .compteBancaire(c)
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
        var rows = historiqueRepository.findByReferenceOrderByDateDesc(reference);
        if (rows.isEmpty()) return;

        for (HistoriqueTresorerie h : rows) {
            CompteBancaire c = h.getCompteBancaire();
            if (c == null) c = primaryCompte();
            if (c != null && h.getMontant() != null) {
                double current = c.getSolde() == null ? 0d : c.getSolde();
                // h.montant is signed; reversing means subtracting it.
                c.setSolde(Math.max(0d, current - h.getMontant()));
                compteRepository.save(c);
            }
            historiqueRepository.delete(h);
        }
    }

    private CompteBancaire resolveRequiredCompte(Long compteBancaireId) {
        if (compteBancaireId == null) {
            throw new IllegalArgumentException("Compte bancaire obligatoire.");
        }
        return resolveCompte(compteBancaireId);
    }

    private static double requirePositiveAmount(double amount) {
        double abs = Math.abs(amount);
        if (abs <= 0d) {
            throw new IllegalArgumentException("Montant invalide.");
        }
        return abs;
    }
}
