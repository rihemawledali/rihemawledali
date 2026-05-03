package com.project_pfe_srt.project_srt.dto;

import lombok.*;

import java.util.List;

/**
 * Aggregated stats for the trésorier dashboard.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreasurerStatsDto {

    /** Sum of all comptes bancaires soldes. */
    private Double soldeTotal;

    /** Currency of the *first* compte (display only — frontend picks). */
    private String deviseAffichage;

    /** Counts by entity / status. */
    private long facturesNonPayees;
    private long facturesEnRetard;
    private long indemnitesEnAttente;
    private long indemnitesValidees;
    private long pretsEnAttente;
    private long adhesionsEnAttente;
    private long retenuesGenerees;
    private long retenuesConfirmees;

    /** Last N comptes bancaires for quick overview. */
    private List<CompteBancaireDto> comptes;
}
