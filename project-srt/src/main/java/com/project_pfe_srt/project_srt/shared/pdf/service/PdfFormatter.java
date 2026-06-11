package com.project_pfe_srt.project_srt.shared.pdf.service;

import com.project_pfe_srt.project_srt.shared.fournisseur.entity.Fournisseur;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.function.Function;

final class PdfFormatter {

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.FRENCH);

    private PdfFormatter() {}

    static String date(LocalDate date) {
        return date == null ? "—" : DATE_FORMAT.format(date);
    }

    static String amount(Double amount) {
        if (amount == null) return "0,00";
        return String.format(Locale.FRENCH, "%,.2f", amount).replace('\u00A0', ' ');
    }

    static String textOrEmpty(String value) {
        return value == null ? "" : value;
    }

    static String textOrDash(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }

    static String filenameFrom(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) return "document";
        return rawValue.trim().replaceAll("[^A-Za-z0-9._-]+", "-");
    }

    static String supplierName(Fournisseur supplier) {
        return supplier == null ? "—" : textOrEmpty(supplier.getNom());
    }

    static String supplierField(Fournisseur supplier, Function<Fournisseur, String> field) {
        return supplier == null ? "" : textOrEmpty(field.apply(supplier));
    }
}
