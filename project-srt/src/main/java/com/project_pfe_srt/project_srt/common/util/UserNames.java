package com.project_pfe_srt.project_srt.common.util;

import com.project_pfe_srt.project_srt.auth.entity.User;

/**
 * Format helpers for {@link User}. Centralises the "Prénom Nom" joining
 * logic that was duplicated in CSV exports, paiement beneficiary
 * defaults and the auth display-name helper.
 */
public final class UserNames {

    private UserNames() {}

    /**
     * Returns {@code "Prénom Nom"} (trimmed) with nulls treated as empty.
     * Returns an empty string when {@code user} itself is null.
     */
    public static String fullName(User user) {
        if (user == null) return "";
        String prenom = user.getPrenom() == null ? "" : user.getPrenom();
        String nom = user.getNom() == null ? "" : user.getNom();
        return (prenom + " " + nom).trim();
    }

    /**
     * Same as {@link #fullName} but falls back to the email when both
     * names are blank — useful for UI labels.
     */
    public static String displayName(User user) {
        if (user == null) return "";
        String full = fullName(user);
        if (!full.isEmpty()) return full;
        return user.getEmail() == null ? "" : user.getEmail();
    }
}
