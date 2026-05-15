package com.project_pfe_srt.project_srt.shared.convention.entity;

/**
 * Mode d'avantage applique par une convention.
 *
 * <ul>
 *   <li>{@link #REMISE_POURCENTAGE}   — remise exprimee en % (champ {@code tauxReduction}).</li>
 *   <li>{@link #REMISE_MONTANT_FIXE}  — remise exprimee en montant (champ {@code montantReduction}).</li>
 *   <li>{@link #SUBVENTION_AMICALE}   — subvention financee par l'amicale (champ {@code montantReduction}).</li>
 *   <li>{@link #PRIX_NEGOCIE}         — prix catalogue negocie, decrit via {@code descriptionAvantage}.</li>
 *   <li>{@link #AUTRE}                — autre avantage libre (texte).</li>
 * </ul>
 */
public enum ModeAvantage {
    REMISE_POURCENTAGE,
    REMISE_MONTANT_FIXE,
    SUBVENTION_AMICALE,
    PRIX_NEGOCIE,
    AUTRE
}
