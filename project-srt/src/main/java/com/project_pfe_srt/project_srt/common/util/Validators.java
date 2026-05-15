package com.project_pfe_srt.project_srt.common.util;

import java.util.Set;

/**
 * Small input-validation helpers used by services to keep request
 * handling consistent. Every check throws {@link IllegalArgumentException}
 * (mapped to HTTP 400 by the global handler) with a French message
 * matching the existing API contract.
 *
 * <p>Designed to be tiny on purpose — no Spring magic, no annotations,
 * just static methods that any service can call.</p>
 */
public final class Validators {

    private Validators() {}

    /**
     * Ensures {@code value} (trimmed) is one of {@code allowed}. Returns
     * the trimmed value so it can be assigned directly.
     */
    public static String requireOneOf(Set<String> allowed, String value, String label) {
        if (value == null) {
            throw new IllegalArgumentException(label + " requis.");
        }
        String trimmed = value.trim();
        if (!allowed.contains(trimmed)) {
            throw new IllegalArgumentException(label + " invalide.");
        }
        return trimmed;
    }

    /**
     * Same as {@link #requireOneOf} but lower-cases the value before
     * comparison. Use when the allowed set is lower-case (e.g. "active",
     * "expiree", …).
     */
    public static String requireOneOfLower(Set<String> allowed, String value, String label) {
        if (value == null) {
            throw new IllegalArgumentException(label + " requis.");
        }
        String normalized = value.trim().toLowerCase();
        if (!allowed.contains(normalized)) {
            throw new IllegalArgumentException(label + " invalide.");
        }
        return normalized;
    }

    /** Returns the trimmed value; throws if null or blank. */
    public static String requireNonBlank(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " requis.");
        }
        return value.trim();
    }

    /** Throws if {@code value} is null or not strictly positive. */
    public static double requirePositive(Double value, String label) {
        if (value == null || value <= 0) {
            throw new IllegalArgumentException(label + " invalide.");
        }
        return value;
    }
}
