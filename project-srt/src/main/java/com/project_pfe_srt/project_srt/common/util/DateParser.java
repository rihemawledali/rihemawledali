package com.project_pfe_srt.project_srt.common.util;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

/**
 * Parses ISO-8601 dates coming from the frontend (often as full datetime
 * strings like {@code "2025-01-31T00:00:00.000Z"}). Several services
 * had their own copy of this logic — now everyone uses these helpers.
 */
public final class DateParser {

    private DateParser() {}

    /**
     * Parses an ISO local date. Accepts either a plain {@code yyyy-MM-dd}
     * string or any longer string that starts with one (the first 10
     * characters are used). Throws {@link IllegalArgumentException}
     * with a French message when invalid or missing.
     */
    public static LocalDate parseIsoDate(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Date " + label + " requise.");
        }
        try {
            String head = value.length() >= 10 ? value.substring(0, 10) : value;
            return LocalDate.parse(head);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Date " + label + " invalide.");
        }
    }

    /** Same as {@link #parseIsoDate} but returns {@code fallback} when blank. */
    public static LocalDate parseIsoDateOrDefault(String value, LocalDate fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            String head = value.length() >= 10 ? value.substring(0, 10) : value;
            return LocalDate.parse(head);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Date invalide : " + value);
        }
    }
}
