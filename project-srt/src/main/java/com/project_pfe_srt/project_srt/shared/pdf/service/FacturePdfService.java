package com.project_pfe_srt.project_srt.shared.pdf.service;

import com.project_pfe_srt.project_srt.common.util.Repos;
import com.project_pfe_srt.project_srt.shared.fournisseur.entity.Fournisseur;
import com.project_pfe_srt.project_srt.treasurer.facture.entity.Facture;
import com.project_pfe_srt.project_srt.treasurer.facture.repository.FactureRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FacturePdfService {

    private static final String TEMPLATE = "templates/pdf/facture.html";
    private static final String REQUIRED_STATUT = "payee";

    private final FactureRepository factureRepository;
    private final PdfTemplateRenderer renderer;

    public byte[] generatePdf(Long factureId) {
        Facture facture = Repos.findOrThrow(factureRepository, factureId, "Facture");

        if (facture.getStatut() == null || !REQUIRED_STATUT.equalsIgnoreCase(facture.getStatut())) {
            throw new IllegalArgumentException(
                    "Le PDF n'est disponible qu'après le paiement de la facture.");
        }

        return renderer.render(TEMPLATE, toTemplateValues(facture));
    }

    public String pdfFilename(Long factureId) {
        return factureRepository.findById(factureId)
                .map(facture -> "facture-" + PdfFormatter.filenameFrom(facture.getNumero()) + ".pdf")
                .orElse("facture.pdf");
    }

    private Map<String, String> toTemplateValues(Facture facture) {
        Fournisseur supplier = facture.getFournisseur();
        Map<String, String> values = new HashMap<>();

        values.put("NUMERO", PdfFormatter.textOrEmpty(facture.getNumero()));
        values.put("MONTANT", PdfFormatter.amount(facture.getMontant()));
        values.put("DESCRIPTION", PdfFormatter.textOrDash(facture.getDescription()));

        values.put("DATE_EMISSION", PdfFormatter.date(facture.getDateEmission()));
        values.put("DATE_ECHEANCE", PdfFormatter.date(facture.getDateEcheance()));
        values.put("DATE_IMPRESSION", PdfFormatter.date(LocalDate.now()));

        values.put("STATUT_LABEL", frenchLabel(facture.getStatut()));
        values.put("STATUT_CLASS", cssClass(facture.getStatut()));

        values.put("FOURNISSEUR_NOM", PdfFormatter.supplierName(supplier));
        values.put("FOURNISSEUR_ADRESSE", PdfFormatter.supplierField(supplier, Fournisseur::getAdresse));
        values.put("FOURNISSEUR_TELEPHONE", PdfFormatter.supplierField(supplier, Fournisseur::getTelephone));
        values.put("FOURNISSEUR_EMAIL", PdfFormatter.supplierField(supplier, Fournisseur::getEmail));

        return values;
    }

    private static String frenchLabel(String statut) {
        if (statut == null) return "—";
        return switch (statut.toLowerCase(Locale.ROOT)) {
            case "brouillon"          -> "Brouillon";
            case "non_payee", "impayee" -> "Non payée";
            case "partielle"          -> "Partielle";
            case "en_retard"          -> "En retard";
            case "payee"              -> "Payée";
            case "annulee"            -> "Annulée";
            default                   -> statut;
        };
    }

    private static String cssClass(String statut) {
        if (statut == null) return "neutral";
        return switch (statut.toLowerCase(Locale.ROOT)) {
            case "payee"                -> "success";
            case "annulee", "en_retard" -> "danger";
            case "partielle"            -> "info";
            case "non_payee", "impayee" -> "warning";
            default                     -> "neutral";
        };
    }
}
