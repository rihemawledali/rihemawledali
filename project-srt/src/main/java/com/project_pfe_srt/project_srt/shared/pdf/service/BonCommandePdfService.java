package com.project_pfe_srt.project_srt.shared.pdf.service;

import com.project_pfe_srt.project_srt.shared.fournisseur.entity.Fournisseur;
import com.project_pfe_srt.project_srt.treasurer.boncommande.entity.BonCommande;
import com.project_pfe_srt.project_srt.treasurer.boncommande.repository.BonCommandeRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Builds the bon-de-commande purchase-order PDF that the trésorier sends
 * to the fournisseur. Available only while the bon is still in
 * {@code brouillon} — once it is validated we consider the order sent.
 *
 * <p>Delegates the actual rendering to the reusable
 * {@link PdfTemplateRenderer}.</p>
 */
@Service
@RequiredArgsConstructor
public class BonCommandePdfService {

    private static final String TEMPLATE = "templates/pdf/bon-commande.html";
    private static final DateTimeFormatter DATE_FR =
            DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.FRENCH);

    private final BonCommandeRepository bonCommandeRepository;
    private final PdfTemplateRenderer renderer;

    public byte[] render(Long bonId) {
        BonCommande b = com.project_pfe_srt.project_srt.common.util.Repos
                .findOrThrow(bonCommandeRepository, bonId, "Bon de commande");
        if (b.getStatut() == null || !"brouillon".equalsIgnoreCase(b.getStatut())) {
            throw new IllegalArgumentException(
                    "Le PDF n'est disponible que pour les bons de commande en brouillon.");
        }
        return renderer.render(TEMPLATE, buildContext(b));
    }

    public String suggestedFilename(Long bonId) {
        return bonCommandeRepository.findById(bonId)
                .map(b -> "bon-commande-" + sanitize(b.getNumero()) + ".pdf")
                .orElse("bon-commande.pdf");
    }

    // ------------------------------------------------------------------
    // Context
    // ------------------------------------------------------------------

    private Map<String, String> buildContext(BonCommande b) {
        Fournisseur f = b.getFournisseur();
        Map<String, String> ctx = new HashMap<>();

        ctx.put("NUMERO", nullSafe(b.getNumero()));
        ctx.put("TYPE_LABEL", typeLabel(b.getTypeBon()));
        ctx.put("VALEUR_UNITAIRE", formatAmount(b.getValeurUnitaire()));
        ctx.put("QUANTITE", b.getQuantiteTotale() == null
                ? "—" : String.valueOf(b.getQuantiteTotale()));
        ctx.put("MONTANT", formatAmount(b.getMontant()));

        ctx.put("DATE_EMISSION", formatDate(b.getDateEmission()));
        ctx.put("DATE_EXPIRATION", formatDate(b.getDateExpiration()));
        ctx.put("DATE_IMPRESSION", DATE_FR.format(LocalDate.now()));

        ctx.put("FOURNISSEUR_NOM", f == null ? "—" : nullSafe(f.getNom()));
        ctx.put("FOURNISSEUR_ADRESSE", f == null ? "" : nullSafe(f.getAdresse()));
        ctx.put("FOURNISSEUR_TELEPHONE", f == null ? "" : nullSafe(f.getTelephone()));
        ctx.put("FOURNISSEUR_EMAIL", f == null ? "" : nullSafe(f.getEmail()));

        return ctx;
    }

    // ------------------------------------------------------------------
    // Formatters
    // ------------------------------------------------------------------

    private static String typeLabel(String raw) {
        if (raw == null) return "—";
        return switch (raw.toLowerCase(Locale.ROOT)) {
            case "cafeteria"  -> "Cafétéria";
            case "restaurant" -> "Restaurant";
            default           -> raw;
        };
    }

    private static String formatDate(LocalDate d) {
        return d == null ? "—" : DATE_FR.format(d);
    }

    private static String formatAmount(Double v) {
        if (v == null) return "0,00";
        return String.format(Locale.FRENCH, "%,.2f", v).replace('\u00A0', ' ');
    }

    private static String nullSafe(String v) {
        return v == null ? "" : v;
    }

    private static String sanitize(String v) {
        if (v == null || v.isBlank()) return "document";
        return v.trim().replaceAll("[^A-Za-z0-9._-]+", "-");
    }
}
