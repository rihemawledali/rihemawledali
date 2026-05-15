package com.project_pfe_srt.project_srt.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a business entity (adhésion, paiement, facture, …) cannot
 * be found by id. Handled as HTTP 404 by {@link GlobalExceptionHandler}
 * because it extends {@link ApiException}.
 *
 * <p>Prefer this over {@code IllegalArgumentException("X introuvable.")}
 * so the API returns 404 instead of 400 for missing resources.</p>
 */
public class NotFoundException extends ApiException {

    public NotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }

    /** Convenience: builds the standard French "<Label> introuvable." message. */
    public static NotFoundException of(String label) {
        return new NotFoundException(label + " introuvable.");
    }
}
