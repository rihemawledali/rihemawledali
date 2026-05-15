package com.project_pfe_srt.project_srt.common.util;

/**
 * Tiny money helpers. The app stores amounts as {@code double} (DT),
 * so we round half-up to two decimals at the boundary to avoid
 * accumulating floating-point noise (cotisation totals, retenue
 * totals, ticket restaurant 50% split, …).
 */
public final class Money {

    private Money() {}

    /** Rounds {@code value} to 2 decimals. Returns 0 if {@code value} is null. */
    public static double round2(Double value) {
        if (value == null) return 0d;
        return Math.round(value * 100d) / 100d;
    }

    /** Same as {@link #round2(Double)} for primitive double. */
    public static double round2(double value) {
        return Math.round(value * 100d) / 100d;
    }

    /** Null-safe getter returning {@code 0.0} when {@code value} is null. */
    public static double orZero(Double value) {
        return value == null ? 0d : value;
    }
}
