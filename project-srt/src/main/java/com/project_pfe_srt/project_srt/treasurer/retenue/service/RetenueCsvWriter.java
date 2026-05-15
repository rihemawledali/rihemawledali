package com.project_pfe_srt.project_srt.treasurer.retenue.service;

import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.common.util.Money;
import com.project_pfe_srt.project_srt.common.util.UserNames;
import com.project_pfe_srt.project_srt.treasurer.retenue.entity.RetenueLigne;
import com.project_pfe_srt.project_srt.treasurer.retenue.entity.RetenueMensuelle;
import com.project_pfe_srt.project_srt.treasurer.retenue.repository.RetenueLigneRepository;

import java.util.List;
import java.util.Locale;

/**
 * Builds the two CSV flavours produced by {@link RetenueService}:
 *
 * <ul>
 *   <li>"single" — one retenue with all its lignes (one row per ligne).</li>
 *   <li>"period" — one row per retenue master for a given (mois, annee).</li>
 * </ul>
 *
 * Kept separate from {@link RetenueService} so the service file stays
 * focused on workflow logic and the CSV format can evolve in isolation.
 * Package-private on purpose — no other package needs it.
 */
final class RetenueCsvWriter {

    /** Excel reads UTF-8 reliably only when the file starts with a BOM. */
    private static final char BOM = '\uFEFF';
    private static final char SEPARATOR = ';';

    private final RetenueLigneRepository ligneRepo;

    RetenueCsvWriter(RetenueLigneRepository ligneRepo) {
        this.ligneRepo = ligneRepo;
    }

    /** CSV for a single retenue + its lignes. Ends with a TOTAL summary row. */
    String single(RetenueMensuelle r, List<RetenueLigne> lignes) {
        StringBuilder sb = new StringBuilder();
        sb.append(BOM);
        sb.append("Adherent;Matricule;Mois;Annee;Type;Libelle;Montant;StatutLigne\n");

        String adherentName = UserNames.fullName(r.getAdherent());
        String matricule = matriculeOf(r.getAdherent());

        for (RetenueLigne l : lignes) {
            appendField(sb, adherentName);
            appendField(sb, matricule);
            sb.append(r.getMois()).append(SEPARATOR);
            sb.append(r.getAnnee()).append(SEPARATOR);
            appendField(sb, l.getType());
            appendField(sb, l.getLibelle());
            sb.append(formatMontant(l.getMontant())).append(SEPARATOR);
            appendField(sb, l.getStatut());
            sb.append('\n');
        }

        sb.append('\n');
        sb.append("TOTAL;;;;;;").append(formatMontant(r.getTotalRetenu())).append(";\n");
        return sb.toString();
    }

    /** CSV for many retenues — one summary row per master. */
    String period(List<RetenueMensuelle> masters) {
        StringBuilder sb = new StringBuilder();
        sb.append(BOM);
        sb.append("Adherent;Matricule;Mois;Annee;TotalCotisation;TotalPret;TotalConvention;TotalRetenu;Statut\n");

        for (RetenueMensuelle r : masters) {
            List<RetenueLigne> lignes = ligneRepo.findByRetenueIdOrderByIdAsc(r.getId());
            Totals totals = sumByType(lignes);

            appendField(sb, UserNames.fullName(r.getAdherent()));
            appendField(sb, matriculeOf(r.getAdherent()));
            sb.append(r.getMois()).append(SEPARATOR);
            sb.append(r.getAnnee()).append(SEPARATOR);
            sb.append(formatMontant(totals.cotisation)).append(SEPARATOR);
            sb.append(formatMontant(totals.pret)).append(SEPARATOR);
            sb.append(formatMontant(totals.convention)).append(SEPARATOR);
            sb.append(formatMontant(r.getTotalRetenu())).append(SEPARATOR);
            appendField(sb, r.getStatut());
            sb.append('\n');
        }
        return sb.toString();
    }

    // ---- internals -------------------------------------------------------

    private static Totals sumByType(List<RetenueLigne> lignes) {
        Totals t = new Totals();
        for (RetenueLigne l : lignes) {
            if ("ANNULEE".equalsIgnoreCase(l.getStatut())) continue;
            double v = Money.orZero(l.getMontant());
            String type = l.getType() == null ? "" : l.getType().toUpperCase();
            switch (type) {
                case "COTISATION" -> t.cotisation += v;
                case "PRET" -> t.pret += v;
                case "CONVENTION", "TICKET_RESTAURANT" -> t.convention += v;
                default -> { /* ignored on purpose */ }
            }
        }
        return t;
    }

    private static String matriculeOf(User u) {
        if (u == null || u.getMatricule() == null) return "";
        return u.getMatricule();
    }

    private static void appendField(StringBuilder sb, String raw) {
        sb.append(escape(raw)).append(SEPARATOR);
    }

    /** Quotes a CSV field if it contains a separator, quote or line break. */
    private static String escape(String raw) {
        if (raw == null) return "";
        String v = raw.replace("\"", "\"\"");
        boolean needsQuotes = v.indexOf(SEPARATOR) >= 0
                || v.indexOf('"') >= 0
                || v.indexOf('\n') >= 0
                || v.indexOf('\r') >= 0;
        return needsQuotes ? "\"" + v + "\"" : v;
    }

    private static String formatMontant(Double v) {
        return String.format(Locale.ROOT, "%.2f", Money.orZero(v));
    }

    private static final class Totals {
        double cotisation;
        double pret;
        double convention;
    }
}
