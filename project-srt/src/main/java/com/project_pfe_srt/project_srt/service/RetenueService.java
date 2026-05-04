package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.RetenueMensuelleDto;
import com.project_pfe_srt.project_srt.entity.*;
import com.project_pfe_srt.project_srt.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/**
 * Retenue mensuelle = somme des sommes à retenir sur la paie d'un adhérent
 * pour un mois donné (cotisation + échéances de prêts + conventions).
 *
 * Workflow (statut master):
 *   GENEREE ⇄ EXPORTEE
 *
 * Export is a pure document-generation step (CSV bytes produced by the
 * backend via {@link #exportToCsv}). It stamps {@code dateExport} and
 * flips the master to {@code EXPORTEE}; rollback to GENEREE clears it.
 * No trésorerie ledger side-effect is attached to this transition.
 */
@Service
@RequiredArgsConstructor
public class RetenueService {

    private static final List<String> ORDER = List.of("GENEREE", "EXPORTEE");
    private static final Set<String> STATUTS = Set.copyOf(ORDER);

    /** Ligne-level statut vocabulary (independent of master). */
    private static final Set<String> LIGNE_STATUTS = Set.of("GENEREE", "EN_ATTENTE", "PRELEVEE", "ANNULEE");

    private final RetenueMensuelleRepository retenueRepo;
    private final RetenueLigneRepository ligneRepo;
    private final UserRepository userRepository;
    private final AdhesionRepository adhesionRepository;
    private final PretRepository pretRepository;
    private final TicketRepository ticketRepository;

    // ----- Listing -----

    public List<RetenueMensuelleDto> list() {
        return retenueRepo.findAllByOrderByAnneeDescMoisDescIdAsc().stream()
                .map(r -> RetenueMensuelleDto.from(r, ligneRepo.findByRetenueIdOrderByIdAsc(r.getId())))
                .toList();
    }

    public List<RetenueMensuelleDto> listByPeriod(int mois, int annee) {
        return retenueRepo.findByMoisAndAnneeOrderByIdAsc(mois, annee).stream()
                .map(r -> RetenueMensuelleDto.from(r, ligneRepo.findByRetenueIdOrderByIdAsc(r.getId())))
                .toList();
    }

    public RetenueMensuelleDto getById(Long id) {
        RetenueMensuelle r = retenueRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Retenue introuvable."));
        return RetenueMensuelleDto.from(r, ligneRepo.findByRetenueIdOrderByIdAsc(r.getId()));
    }

    /**
     * Force-regenerate the lignes of one master row. Resets EXPORTEE → GENEREE
     * if needed so the recompute can run. Used by the « Régénérer » row
     * action in the trésorier UI.
     */
    @Transactional
    public RetenueMensuelleDto regenerate(Long id) {
        RetenueMensuelle r = retenueRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Retenue introuvable."));
        if (r.getAdherent() == null) {
            throw new IllegalArgumentException("Retenue sans adhérent — régénération impossible.");
        }
        if ("EXPORTEE".equalsIgnoreCase(r.getStatut())) {
            r.setStatut("GENEREE");
            r.setDateExport(null);
            retenueRepo.save(r);
        }
        RetenueMensuelle refreshed = upsertOne(r.getAdherent(), r.getMois(), r.getAnnee());
        return RetenueMensuelleDto.from(refreshed, ligneRepo.findByRetenueIdOrderByIdAsc(refreshed.getId()));
    }

    // ----- Generation (idempotent) -----

    @Transactional
    public List<RetenueMensuelleDto> generate(Integer mois, Integer annee) {
        YearMonth ym = YearMonth.now();
        int m = (mois == null || mois < 1 || mois > 12) ? ym.getMonthValue() : mois;
        int y = (annee == null || annee < 2000) ? ym.getYear() : annee;

        List<User> adherents = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADHERENT)
                .toList();

        List<RetenueMensuelle> generated = new ArrayList<>();
        for (User u : adherents) {
            generated.add(upsertOne(u, m, y));
        }
        return generated.stream()
                .map(r -> RetenueMensuelleDto.from(r, ligneRepo.findByRetenueIdOrderByIdAsc(r.getId())))
                .toList();
    }

    /**
     * Refresh the retenue master + lignes for a single adhérent and period.
     * Public entry point used by other services (e.g. when the trésorier
     * validates an adhésion we want the current-month retenue to pick up
     * the new cotisation line without waiting for the monthly generate).
     *
     * <p>If a master already exists for the period in {@code EXPORTEE}, it
     * is rolled back to {@code GENEREE} so the new lignes can be written —
     * an already-exported CSV is by definition stale once an adhésion is
     * activated for that month.</p>
     */
    @Transactional
    public RetenueMensuelleDto refreshForAdherent(User adherent, int mois, int annee) {
        retenueRepo.findByAdherentIdAndMoisAndAnnee(adherent.getId(), mois, annee)
                .ifPresent(existing -> {
                    if ("EXPORTEE".equalsIgnoreCase(existing.getStatut())) {
                        existing.setStatut("GENEREE");
                        existing.setDateExport(null);
                        retenueRepo.save(existing);
                    }
                });
        RetenueMensuelle r = upsertOne(adherent, mois, annee);
        return RetenueMensuelleDto.from(r, ligneRepo.findByRetenueIdOrderByIdAsc(r.getId()));
    }

    /**
     * Generates (or refreshes) one retenue master + its detail rows for an
     * adhérent / mois / année. Only operates if the master is still in
     * GENEREE — once exported the rows are frozen.
     */
    @Transactional
    protected RetenueMensuelle upsertOne(User adherent, int mois, int annee) {
        RetenueMensuelle master = retenueRepo
                .findByAdherentIdAndMoisAndAnnee(adherent.getId(), mois, annee)
                .orElseGet(() -> retenueRepo.save(RetenueMensuelle.builder()
                        .adherent(adherent)
                        .mois(mois).annee(annee)
                        .totalRetenu(0d)
                        .statut("GENEREE")
                        .build()));

        if (!"GENEREE".equalsIgnoreCase(master.getStatut())) {
            // Frozen — return as-is.
            return master;
        }

        // Wipe existing rows, recompute from sources.
        ligneRepo.deleteByRetenueId(master.getId());

        List<RetenueLigne> rows = new ArrayList<>();
        double total = 0d;

        // 1) Cotisation — based on the active adhésion at the period start.
        LocalDate periodStart = LocalDate.of(annee, mois, 1);
        adhesionRepository
                .findFirstByAdherentIdAndStatutOrderByDateDebutDesc(adherent.getId(), "active")
                .filter(a -> !a.getDateDebut().isAfter(periodStart) && !a.getDateFin().isBefore(periodStart))
                .ifPresent(a -> rows.add(RetenueLigne.builder()
                        .retenue(master).type("COTISATION")
                        .montant(a.getMontantCotisation())
                        .libelle("Cotisation mensuelle")
                        .sourceRefId(a.getId())
                        .statut("GENEREE").build()));

        // 2) Prêts en_cours — monthly payment using the same formula as the frontend.
        for (PretSocial p : pretRepository.findByAdherentIdOrderByDateDemandeDesc(adherent.getId())) {
            if (!"en_cours".equalsIgnoreCase(p.getStatut())) continue;
            double monthly = PretService.calculateMonthlyPayment(
                    p.getMontant(), p.getDuree(), p.getTaux());
            rows.add(RetenueLigne.builder()
                    .retenue(master).type("PRET")
                    .montant(Math.round(monthly * 100d) / 100d)
                    .libelle("Échéance prêt #" + p.getId())
                    .sourceRefId(p.getId())
                    .statut("GENEREE").build());
        }

        // 3) Accepted tickets restaurant — adherent pays 50% once, in the acceptance month.
        for (TicketRestaurant ticket : ticketRepository.findByAdherentIdAndStatutOrderByDateDecisionDesc(adherent.getId(), "utilise")) {
            LocalDate decisionDate = ticket.getDateDecision() == null ? ticket.getDateAttribution() : ticket.getDateDecision();
            if (decisionDate == null || decisionDate.getMonthValue() != mois || decisionDate.getYear() != annee) {
                continue;
            }
            double ticketAmount = ticket.getMontant() == null ? 0d : ticket.getMontant();
            double retained = Math.round((ticketAmount * 0.5d) * 100d) / 100d;
            rows.add(RetenueLigne.builder()
                    .retenue(master).type("TICKET_RESTAURANT")
                    .montant(retained)
                    .libelle("Ticket restaurant #" + ticket.getNumero() + " (50%)")
                    .sourceRefId(ticket.getId())
                    .statut("GENEREE").build());
        }

        // 4) Conventions — placeholder (no recurring billing modeled yet).
        // Add specific lines here when conventions gain a billing schedule.

        for (RetenueLigne line : rows) {
            total += line.getMontant() == null ? 0d : line.getMontant();
        }
        ligneRepo.saveAll(rows);

        master.setTotalRetenu(Math.round(total * 100d) / 100d);
        return retenueRepo.save(master);
    }

    // ----- Statut transitions -----

    @Transactional
    public RetenueMensuelleDto setStatut(Long id, String target, String userName) {
        if (target == null || !STATUTS.contains(target.toUpperCase())) {
            throw new IllegalArgumentException("Statut cible invalide.");
        }
        String tgt = target.toUpperCase();
        RetenueMensuelle r = retenueRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Retenue introuvable."));
        String current = r.getStatut().toUpperCase();
        int from = ORDER.indexOf(current);
        int to = ORDER.indexOf(tgt);
        if (Math.abs(to - from) != 1) {
            throw new IllegalArgumentException("Transition non autorisée : " + current + " → " + tgt);
        }
        return RetenueMensuelleDto.from(applyTransition(r, tgt), ligneRepo.findByRetenueIdOrderByIdAsc(r.getId()));
    }

    /**
     * Core transition: flips statut, stamps/clears {@code dateExport}, and
     * cascades line-level statuts (GENEREE/EN_ATTENTE → PRELEVEE on export;
     * PRELEVEE → GENEREE on rollback). No trésorerie ledger impact.
     */
    private RetenueMensuelle applyTransition(RetenueMensuelle r, String tgt) {
        boolean exporting = "EXPORTEE".equals(tgt);
        boolean rollingBack = "GENEREE".equals(tgt);

        r.setStatut(tgt);
        if (exporting && r.getDateExport() == null) {
            r.setDateExport(LocalDateTime.now());
        } else if (rollingBack) {
            r.setDateExport(null);
        }

        var rows = ligneRepo.findByRetenueIdOrderByIdAsc(r.getId());
        if (exporting) {
            for (RetenueLigne l : rows) {
                if ("GENEREE".equals(l.getStatut()) || "EN_ATTENTE".equals(l.getStatut())) {
                    l.setStatut("PRELEVEE");
                }
            }
        } else if (rollingBack) {
            for (RetenueLigne l : rows) {
                if ("PRELEVEE".equals(l.getStatut())) l.setStatut("GENEREE");
            }
        }
        ligneRepo.saveAll(rows);
        return retenueRepo.save(r);
    }

    /** Update one ligne's statut (independent of the master statut). */
    @Transactional
    public RetenueMensuelleDto setLigneStatut(Long retenueId, Long ligneId, String target) {
        if (target == null || !LIGNE_STATUTS.contains(target.toUpperCase())) {
            throw new IllegalArgumentException("Statut de ligne invalide.");
        }
        String tgt = target.toUpperCase();
        RetenueMensuelle r = retenueRepo.findById(retenueId)
                .orElseThrow(() -> new IllegalArgumentException("Retenue introuvable."));
        RetenueLigne l = ligneRepo.findById(ligneId)
                .orElseThrow(() -> new IllegalArgumentException("Ligne introuvable."));
        if (!l.getRetenue().getId().equals(r.getId())) {
            throw new IllegalArgumentException("La ligne n'appartient pas à cette retenue.");
        }
        l.setStatut(tgt);
        ligneRepo.save(l);

        // Recompute total: ANNULEE lignes are excluded.
        var rows = ligneRepo.findByRetenueIdOrderByIdAsc(r.getId());
        double total = rows.stream()
                .filter(x -> !"ANNULEE".equals(x.getStatut()))
                .mapToDouble(x -> x.getMontant() == null ? 0d : x.getMontant())
                .sum();
        r.setTotalRetenu(Math.round(total * 100d) / 100d);
        r = retenueRepo.save(r);
        return RetenueMensuelleDto.from(r, rows);
    }

    /** Recent retenues for one adhérent. */
    public List<RetenueMensuelleDto> historyForAdherent(Long adherentId) {
        return retenueRepo.findAllByOrderByAnneeDescMoisDescIdAsc().stream()
                .filter(r -> r.getAdherent() != null && adherentId.equals(r.getAdherent().getId()))
                .map(r -> RetenueMensuelleDto.from(r, ligneRepo.findByRetenueIdOrderByIdAsc(r.getId())))
                .toList();
    }

    // =========================================================
    // CSV export
    // =========================================================

    /** Thin value object: encapsulates CSV bytes + a suggested filename. */
    public record CsvExport(byte[] content, String filename) {}

    /**
     * Export a single retenue (one adhérent × mois) with its lignes. Flips
     * the master to EXPORTEE (stamping {@code dateExport}) on the first
     * call; subsequent calls just re-emit the same file.
     */
    @Transactional
    public CsvExport exportToCsv(Long id) {
        RetenueMensuelle r = retenueRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Retenue introuvable."));
        if ("GENEREE".equalsIgnoreCase(r.getStatut())) {
            r = applyTransition(r, "EXPORTEE");
        }
        List<RetenueLigne> lignes = ligneRepo.findByRetenueIdOrderByIdAsc(r.getId());
        String filename = String.format("retenue-%d-%02d-%s.csv", r.getAnnee(), r.getMois(), r.getId());
        return new CsvExport(buildSingleCsv(r, lignes).getBytes(StandardCharsets.UTF_8), filename);
    }

    /**
     * Export every retenue for a given period as one CSV. Any master still
     * in GENEREE is flipped to EXPORTEE by the same call.
     */
    @Transactional
    public CsvExport exportPeriodToCsv(int mois, int annee) {
        List<RetenueMensuelle> masters = new ArrayList<>(retenueRepo.findByMoisAndAnneeOrderByIdAsc(mois, annee));
        if (masters.isEmpty()) {
            throw new IllegalArgumentException("Aucune retenue pour la période sélectionnée.");
        }
        List<RetenueMensuelle> refreshed = new ArrayList<>(masters.size());
        for (RetenueMensuelle r : masters) {
            if ("GENEREE".equalsIgnoreCase(r.getStatut())) {
                refreshed.add(applyTransition(r, "EXPORTEE"));
            } else {
                refreshed.add(r);
            }
        }
        refreshed.sort(Comparator.comparing(m -> m.getAdherent() == null ? "" : ((m.getAdherent().getNom() == null ? "" : m.getAdherent().getNom()) + " " + (m.getAdherent().getPrenom() == null ? "" : m.getAdherent().getPrenom()))));
        String filename = String.format("retenues-%d-%02d.csv", annee, mois);
        return new CsvExport(buildPeriodCsv(refreshed).getBytes(StandardCharsets.UTF_8), filename);
    }

    // ----- CSV builders -----

    private String buildSingleCsv(RetenueMensuelle r, List<RetenueLigne> lignes) {
        StringBuilder sb = new StringBuilder();
        // UTF-8 BOM so Excel picks up accents correctly when opening the file.
        sb.append('\uFEFF');
        sb.append("Adherent;Matricule;Mois;Annee;Type;Libelle;Montant;StatutLigne\n");
        String adherentNom = r.getAdherent() == null ? "" :
                ((r.getAdherent().getPrenom() == null ? "" : r.getAdherent().getPrenom() + " ")
                        + (r.getAdherent().getNom() == null ? "" : r.getAdherent().getNom()));
        String matricule = r.getAdherent() == null ? "" : safe(getMatricule(r.getAdherent()));
        for (RetenueLigne l : lignes) {
            sb.append(csv(adherentNom)).append(';')
              .append(csv(matricule)).append(';')
              .append(r.getMois()).append(';')
              .append(r.getAnnee()).append(';')
              .append(csv(l.getType())).append(';')
              .append(csv(l.getLibelle())).append(';')
              .append(formatMontant(l.getMontant())).append(';')
              .append(csv(l.getStatut()))
              .append('\n');
        }
        // Summary row with master total.
        sb.append("\n");
        sb.append("TOTAL;;;;;;").append(formatMontant(r.getTotalRetenu())).append(";\n");
        return sb.toString();
    }

    private String buildPeriodCsv(List<RetenueMensuelle> masters) {
        StringBuilder sb = new StringBuilder();
        sb.append('\uFEFF');
        sb.append("Adherent;Matricule;Mois;Annee;TotalCotisation;TotalPret;TotalConvention;TotalRetenu;Statut\n");
        for (RetenueMensuelle r : masters) {
            List<RetenueLigne> lignes = ligneRepo.findByRetenueIdOrderByIdAsc(r.getId());
            double cot = 0, pret = 0, conv = 0;
            for (RetenueLigne l : lignes) {
                if ("ANNULEE".equalsIgnoreCase(l.getStatut())) continue;
                double v = l.getMontant() == null ? 0d : l.getMontant();
                if ("COTISATION".equalsIgnoreCase(l.getType())) cot += v;
                else if ("PRET".equalsIgnoreCase(l.getType())) pret += v;
                else if ("CONVENTION".equalsIgnoreCase(l.getType()) || "TICKET_RESTAURANT".equalsIgnoreCase(l.getType())) conv += v;
            }
            String adherentNom = r.getAdherent() == null ? "" :
                    ((r.getAdherent().getPrenom() == null ? "" : r.getAdherent().getPrenom() + " ")
                            + (r.getAdherent().getNom() == null ? "" : r.getAdherent().getNom()));
            String matricule = r.getAdherent() == null ? "" : safe(getMatricule(r.getAdherent()));
            sb.append(csv(adherentNom)).append(';')
              .append(csv(matricule)).append(';')
              .append(r.getMois()).append(';')
              .append(r.getAnnee()).append(';')
              .append(formatMontant(cot)).append(';')
              .append(formatMontant(pret)).append(';')
              .append(formatMontant(conv)).append(';')
              .append(formatMontant(r.getTotalRetenu())).append(';')
              .append(csv(r.getStatut()))
              .append('\n');
        }
        return sb.toString();
    }

    // ----- Small CSV utilities -----

    private static String csv(String raw) {
        if (raw == null) return "";
        String v = raw.replace("\"", "\"\"");
        // Quote when the field contains CSV separators or quotes.
        if (v.indexOf(';') >= 0 || v.indexOf('"') >= 0 || v.indexOf('\n') >= 0 || v.indexOf('\r') >= 0) {
            return "\"" + v + "\"";
        }
        return v;
    }

    private static String formatMontant(Double v) {
        if (v == null) return "0.00";
        return String.format(java.util.Locale.ROOT, "%.2f", v);
    }

    private static String safe(String v) { return v == null ? "" : v; }

    /**
     * The User entity may not expose a matricule field directly — try a
     * few common getters reflectively so the CSV stays useful even if the
     * column is named differently across deployments.
     */
    private static String getMatricule(User u) {
        try {
            var m = u.getClass().getMethod("getMatricule");
            Object v = m.invoke(u);
            return v == null ? "" : v.toString();
        } catch (ReflectiveOperationException ignore) {
            return "";
        }
    }
}
