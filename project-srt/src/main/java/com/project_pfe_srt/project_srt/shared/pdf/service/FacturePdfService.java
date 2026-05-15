package com.project_pfe_srt.project_srt.shared.pdf.service;

import com.project_pfe_srt.project_srt.shared.fournisseur.entity.Fournisseur;
import com.project_pfe_srt.project_srt.treasurer.facture.entity.Facture;
import com.project_pfe_srt.project_srt.treasurer.facture.repository.FactureRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Builds the context for the formal-invoice template and delegates
 * rendering to {@link PdfTemplateRenderer}. Kept deliberately thin so a
 * future « receipt » or « bon de commande » PDF only needs a sibling
 * service + a new HTML file.
 */
@Service
@RequiredArgsConstructor
public class FacturePdfService {

    private static final String TEMPLATE = "templates/pdf/facture.html";
    private static final DateTimeFormatter DATE_FR =
            DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.FRENCH);

    private final FactureRepository factureRepository;
    private final PdfTemplateRenderer renderer;

    public byte[] render(Long factureId) {
        Facture f = com.project_pfe_srt.project_srt.common.util.Repos
                .findOrThrow(factureRepository, factureId, "Facture");
        if (f.getStatut() == null || !"payee".equalsIgnoreCase(f.getStatut())) {
            throw new IllegalArgumentException(
                    "Le PDF n'est disponible qu'après le paiement de la facture.");
        }
        return renderer.render(TEMPLATE, buildContext(f));
    }

    public String suggestedFilename(Long factureId) {
        return factureRepository.findById(factureId)
                .map(f -> "facture-" + sanitize(f.getNumero()) + ".pdf")
                .orElse("facture.pdf");
    }

    // ------------------------------------------------------------------
    // Context
    // ------------------------------------------------------------------

    private Map<String, String> buildContext(Facture f) {
        Fournisseur four = f.getFournisseur();
        Map<String, String> ctx = new HashMap<>();

        ctx.put("NUMERO", nullSafe(f.getNumero()));
        ctx.put("MONTANT", formatAmount(f.getMontant()));
        ctx.put("DESCRIPTION",
                f.getDescription() == null || f.getDescription().isBlank()
                        ? "—" : f.getDescription());

        ctx.put("DATE_EMISSION", formatDate(f.getDateEmission()));
        ctx.put("DATE_ECHEANCE", formatDate(f.getDateEcheance()));
        ctx.put("DATE_IMPRESSION", DATE_FR.format(LocalDate.now()));

        ctx.put("STATUT_LABEL", statutLabel(f.getStatut()));
        ctx.put("STATUT_CLASS", statutClass(f.getStatut()));

        // Fournisseur block — safe defaults when some fields are null.
        ctx.put("FOURNISSEUR_NOM", four == null ? "—" : nullSafe(four.getNom()));
        ctx.put("FOURNISSEUR_ADRESSE", four == null ? "" : nullSafe(four.getAdresse()));
        ctx.put("FOURNISSEUR_TELEPHONE", four == null ? "" : nullSafe(four.getTelephone()));
        ctx.put("FOURNISSEUR_EMAIL", four == null ? "" : nullSafe(four.getEmail()));

        return ctx;
    }

    // ------------------------------------------------------------------
    // Formatters
    // ------------------------------------------------------------------

    private static String formatDate(LocalDate d) {
        return d == null ? "—" : DATE_FR.format(d);
    }

    private static String formatAmount(Double v) {
        if (v == null) return "0,00";
        // French locale: space thousands separator, comma decimal.
        return String.format(Locale.FRENCH, "%,.2f", v).replace('\u00A0', ' ');
    }

    private static String statutLabel(String s) {
        if (s == null) return "—";
        return switch (s.toLowerCase(Locale.ROOT)) {
            case "brouillon"  -> "Brouillon";
            case "non_payee", "impayee" -> "Non payée";
            case "partielle"  -> "Partielle";
            case "en_retard"  -> "En retard";
            case "payee"      -> "Payée";
            case "annulee"    -> "Annulée";
            default           -> s;
        };
    }

    /** Maps the raw status to a CSS class suffix used in the template. */
    private static String statutClass(String s) {
        if (s == null) return "neutral";
        return switch (s.toLowerCase(Locale.ROOT)) {
            case "payee"                 -> "success";
            case "annulee", "en_retard"  -> "danger";
            case "partielle"             -> "info";
            case "non_payee", "impayee"  -> "warning";
            default                      -> "neutral";
        };
    }

    private static String nullSafe(String v) {
        return v == null ? "" : v;
    }

    private static String sanitize(String v) {
        if (v == null || v.isBlank()) return "document";
        return v.trim().replaceAll("[^A-Za-z0-9._-]+", "-");
    }
}
