package com.project_pfe_srt.project_srt.treasurer.retenue.service;

import com.project_pfe_srt.project_srt.adherent.adhesion.repository.AdhesionRepository;
import com.project_pfe_srt.project_srt.adherent.pret.entity.PretSocial;
import com.project_pfe_srt.project_srt.adherent.pret.repository.PretRepository;
import com.project_pfe_srt.project_srt.adherent.pret.service.PretService;
import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;
import com.project_pfe_srt.project_srt.common.util.Money;
import com.project_pfe_srt.project_srt.common.util.Repos;
import com.project_pfe_srt.project_srt.common.util.UserNames;
import com.project_pfe_srt.project_srt.treasurer.retenue.dto.RetenueMensuelleDto;
import com.project_pfe_srt.project_srt.treasurer.retenue.entity.RetenueLigne;
import com.project_pfe_srt.project_srt.treasurer.retenue.entity.RetenueMensuelle;
import com.project_pfe_srt.project_srt.treasurer.retenue.repository.RetenueLigneRepository;
import com.project_pfe_srt.project_srt.treasurer.retenue.repository.RetenueMensuelleRepository;
import com.project_pfe_srt.project_srt.treasurer.ticket.entity.TicketRestaurant;
import com.project_pfe_srt.project_srt.treasurer.ticket.repository.TicketRepository;

import jakarta.annotation.PostConstruct;
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
@Service
@RequiredArgsConstructor
public class RetenueService {

    private static final String GENEREE = "GENEREE";
    private static final String EXPORTEE = "EXPORTEE";
    private static final String LIGNE_PRELEVEE = "PRELEVEE";
    private static final String LIGNE_EN_ATTENTE = "EN_ATTENTE";
    private static final String LIGNE_ANNULEE = "ANNULEE";

    /** Ordered master statut transitions allowed (forward + backward). */
    private static final List<String> MASTER_ORDER = List.of(GENEREE, EXPORTEE);
    private static final Set<String> MASTER_STATUTS = Set.copyOf(MASTER_ORDER);
    private static final Set<String> LIGNE_STATUTS =
            Set.of(GENEREE, LIGNE_EN_ATTENTE, LIGNE_PRELEVEE, LIGNE_ANNULEE);

    // ---- collaborators ---------------------------------------------------

    private final RetenueMensuelleRepository retenueRepo;
    private final RetenueLigneRepository ligneRepo;
    private final UserRepository userRepository;
    private final AdhesionRepository adhesionRepository;
    private final PretRepository pretRepository;
    private final PretService pretService;
    private final TicketRepository ticketRepository;

    private RetenueCsvWriter csvWriter;

    @PostConstruct
    void initCsvWriter() {
        this.csvWriter = new RetenueCsvWriter(ligneRepo);
    }

    // =====================================================================
    // Read
    // =====================================================================

    public List<RetenueMensuelleDto> list() {
        return retenueRepo.findAllByOrderByAnneeDescMoisDescIdAsc().stream()
                .map(this::toDto)
                .toList();
    }

    public List<RetenueMensuelleDto> listByPeriod(int mois, int annee) {
        return retenueRepo.findByMoisAndAnneeOrderByIdAsc(mois, annee).stream()
                .map(this::toDto)
                .toList();
    }

    public RetenueMensuelleDto getById(Long id) {
        return toDto(findMaster(id));
    }

    /** Recent retenues for one adhérent. */
    public List<RetenueMensuelleDto> historyForAdherent(Long adherentId) {
        return retenueRepo.findAllByOrderByAnneeDescMoisDescIdAsc().stream()
                .filter(r -> r.getAdherent() != null && adherentId.equals(r.getAdherent().getId()))
                .map(this::toDto)
                .toList();
    }

    // =====================================================================
    // Generation (idempotent)
    // =====================================================================

    @Transactional
    public List<RetenueMensuelleDto> generate(Integer mois, Integer annee) {
        Period period = Period.coerce(mois, annee);

        List<User> adherents = userRepository.findAllByRoleOrderByIdAsc(Role.ADHERENT);

        List<RetenueMensuelle> generated = new ArrayList<>(adherents.size());
        for (User u : adherents) {
            generated.add(upsertOne(u, period.mois(), period.annee()));
        }
        return generated.stream().map(this::toDto).toList();
    }

    /**
     * Recompute the master + lignes for one adhérent / month. Other
     * services call this after activating an adhésion so the current-month
     * retenue immediately reflects the new cotisation.
     *
     * <p>If the existing master is {@code EXPORTEE}, it is rolled back to
     * {@code GENEREE} first — an already-exported CSV is stale by
     * definition once an adhésion is activated for that month.</p>
     */
    @Transactional
    public RetenueMensuelleDto refreshForAdherent(User adherent, int mois, int annee) {
        retenueRepo.findByAdherentIdAndMoisAndAnnee(adherent.getId(), mois, annee)
                .ifPresent(this::rollbackToGenereeIfExported);
        return toDto(upsertOne(adherent, mois, annee));
    }

    /**
     * Force-regenerate the lignes of one master row. Used by the
     * « Régénérer » action in the trésorier UI.
     */
    @Transactional
    public RetenueMensuelleDto regenerate(Long id) {
        RetenueMensuelle r = findMaster(id);
        if (r.getAdherent() == null) {
            throw new IllegalArgumentException("Retenue sans adhérent - régénération impossible.");
        }
        rollbackToGenereeIfExported(r);
        RetenueMensuelle refreshed = upsertOne(r.getAdherent(), r.getMois(), r.getAnnee());
        return toDto(refreshed);
    }

    // =====================================================================
    // Statut transitions
    // =====================================================================

    @Transactional
    public RetenueMensuelleDto setStatut(Long id, String target, String userName) {
        String tgt = requireMasterStatut(target);
        RetenueMensuelle r = findMaster(id);
        String current = r.getStatut().toUpperCase();
        int from = MASTER_ORDER.indexOf(current);
        int to = MASTER_ORDER.indexOf(tgt);
        if (Math.abs(to - from) != 1) {
            throw new IllegalArgumentException("Transition non autorisée : " + current + " → " + tgt);
        }
        return toDto(applyTransition(r, tgt));
    }

    /** Update one ligne's statut. Recomputes the master total. */
    @Transactional
    public RetenueMensuelleDto setLigneStatut(Long retenueId, Long ligneId, String target) {
        String tgt = requireLigneStatut(target);
        RetenueMensuelle r = findMaster(retenueId);
        RetenueLigne l = Repos.findOrThrow(ligneRepo, ligneId, "Ligne");
        if (!l.getRetenue().getId().equals(r.getId())) {
            throw new IllegalArgumentException("La ligne n'appartient pas à cette retenue.");
        }
        l.setStatut(tgt);
        ligneRepo.save(l);

        List<RetenueLigne> rows = ligneRepo.findByRetenueIdOrderByIdAsc(r.getId());
        r.setTotalRetenu(Money.round2(activeTotal(rows)));
        return RetenueMensuelleDto.from(retenueRepo.save(r), rows);
    }

    // =====================================================================
    // CSV export
    // =====================================================================

    /** Thin value object: CSV bytes + suggested filename. */
    public record CsvExport(byte[] content, String filename) {}

    /**
     * Export one retenue. Flips the master to {@code EXPORTEE} on the
     * first call; subsequent calls re-emit the same file.
     */
    @Transactional
    public CsvExport exportToCsv(Long id) {
        RetenueMensuelle r = findMaster(id);
        if (GENEREE.equalsIgnoreCase(r.getStatut())) {
            r = applyTransition(r, EXPORTEE);
        }
        List<RetenueLigne> lignes = ligneRepo.findByRetenueIdOrderByIdAsc(r.getId());
        String filename = String.format("retenue-%d-%02d-%s.csv", r.getAnnee(), r.getMois(), r.getId());
        return new CsvExport(csvWriter.single(r, lignes).getBytes(StandardCharsets.UTF_8), filename);
    }

    /** Export every retenue of a period; any {@code GENEREE} master is flipped to {@code EXPORTEE}. */
    @Transactional
    public CsvExport exportPeriodToCsv(int mois, int annee) {
        List<RetenueMensuelle> masters = new ArrayList<>(retenueRepo.findByMoisAndAnneeOrderByIdAsc(mois, annee));
        if (masters.isEmpty()) {
            throw new IllegalArgumentException("Aucune retenue pour la période sélectionnée.");
        }
        List<RetenueMensuelle> refreshed = new ArrayList<>(masters.size());
        for (RetenueMensuelle r : masters) {
            refreshed.add(GENEREE.equalsIgnoreCase(r.getStatut()) ? applyTransition(r, EXPORTEE) : r);
        }
        refreshed.sort(Comparator.comparing(m -> UserNames.fullName(m.getAdherent())));
        String filename = String.format("retenues-%d-%02d.csv", annee, mois);
        return new CsvExport(csvWriter.period(refreshed).getBytes(StandardCharsets.UTF_8), filename);
    }

    // =====================================================================
    // Core: upsert master + recompute lignes
    // =====================================================================

    /**
     * Idempotent: creates the master if missing, wipes existing lignes
     * and recomputes them from the live sources (adhésion, prêts,
     * tickets restaurant). Skipped when the master is already past
     * {@code GENEREE} (frozen by export).
     */
    @Transactional
    protected RetenueMensuelle upsertOne(User adherent, int mois, int annee) {
        RetenueMensuelle master = retenueRepo
                .findByAdherentIdAndMoisAndAnnee(adherent.getId(), mois, annee)
                .orElseGet(() -> retenueRepo.save(RetenueMensuelle.builder()
                        .adherent(adherent)
                        .mois(mois).annee(annee)
                        .totalRetenu(0d)
                        .statut(GENEREE)
                        .build()));

        if (!GENEREE.equalsIgnoreCase(master.getStatut())) {
            return master;
        }

        ligneRepo.deleteByRetenueId(master.getId());

        List<RetenueLigne> rows = new ArrayList<>();
        cotisationLine(adherent, mois, annee, master).ifPresent(rows::add);
        rows.addAll(pretLines(adherent, master));
        rows.addAll(ticketLines(adherent, mois, annee, master));

        ligneRepo.saveAll(rows);
        master.setTotalRetenu(Money.round2(sumMontants(rows)));
        return retenueRepo.save(master);
    }

    /** Cotisation line for the active adhésion that covers the period start. */
    private java.util.Optional<RetenueLigne> cotisationLine(
            User adherent, int mois, int annee, RetenueMensuelle master) {
        LocalDate periodStart = LocalDate.of(annee, mois, 1);
        return adhesionRepository
                .findFirstByAdherentIdAndStatutOrderByDateDebutDesc(adherent.getId(), "active")
                .filter(a -> !a.getDateDebut().isAfter(periodStart) && !a.getDateFin().isBefore(periodStart))
                .map(a -> RetenueLigne.builder()
                        .retenue(master).type("COTISATION")
                        .montant(a.getMontantCotisation())
                        .libelle("Cotisation mensuelle")
                        .sourceRefId(a.getId())
                        .statut(GENEREE).build());
    }

    /** One line per {@code en_cours} prêt — monthly payment using the standard formula. */
    private List<RetenueLigne> pretLines(User adherent, RetenueMensuelle master) {
        List<RetenueLigne> out = new ArrayList<>();
        for (PretSocial p : pretRepository.findByAdherentIdOrderByDateDemandeDesc(adherent.getId())) {
            if (!"en_cours".equalsIgnoreCase(p.getStatut())) continue;
            if (pretService.refreshCompletedPret(p)) continue;
            double monthly = PretService.calculateMonthlyPayment(p.getMontant(), p.getDuree(), p.getTaux());
            out.add(RetenueLigne.builder()
                    .retenue(master).type("PRET")
                    .montant(Money.round2(monthly))
                    .libelle("Échéance prêt #" + p.getId())
                    .sourceRefId(p.getId())
                    .statut(GENEREE).build());
        }
        return out;
    }

    /** Tickets restaurant accepted in this period: adhérent pays 50%. */
    private List<RetenueLigne> ticketLines(User adherent, int mois, int annee, RetenueMensuelle master) {
        List<RetenueLigne> out = new ArrayList<>();
        for (TicketRestaurant ticket : ticketRepository.findByAdherentIdAndStatutOrderByDateDecisionDesc(adherent.getId(), "utilise")) {
            LocalDate decisionDate = ticket.getDateDecision() == null ? ticket.getDateAttribution() : ticket.getDateDecision();
            if (decisionDate == null || decisionDate.getMonthValue() != mois || decisionDate.getYear() != annee) {
                continue;
            }
            double retained = Money.round2(Money.orZero(ticket.getMontant()) * 0.5d);
            out.add(RetenueLigne.builder()
                    .retenue(master).type("TICKET_RESTAURANT")
                    .montant(retained)
                    .libelle("Ticket restaurant #" + ticket.getNumero() + " (50%)")
                    .sourceRefId(ticket.getId())
                    .statut(GENEREE).build());
        }
        return out;
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    /**
     * Core transition: flips statut, stamps/clears {@code dateExport},
     * and cascades line-level statuts (GENEREE/EN_ATTENTE → PRELEVEE on
     * export; PRELEVEE → GENEREE on rollback). No trésorerie impact.
     */
    private RetenueMensuelle applyTransition(RetenueMensuelle r, String tgt) {
        boolean exporting = EXPORTEE.equals(tgt);
        boolean rollingBack = GENEREE.equals(tgt);

        r.setStatut(tgt);
        if (exporting && r.getDateExport() == null) {
            r.setDateExport(LocalDateTime.now());
        } else if (rollingBack) {
            r.setDateExport(null);
        }

        List<RetenueLigne> rows = ligneRepo.findByRetenueIdOrderByIdAsc(r.getId());
        if (exporting) {
            cascadeOnExport(rows);
        } else if (rollingBack) {
            cascadeOnRollback(rows);
        }
        ligneRepo.saveAll(rows);
        if (exporting) {
            refreshCompletedPrets(rows);
        }
        return retenueRepo.save(r);
    }

    private static void cascadeOnExport(List<RetenueLigne> rows) {
        for (RetenueLigne l : rows) {
            if (GENEREE.equals(l.getStatut()) || LIGNE_EN_ATTENTE.equals(l.getStatut())) {
                l.setStatut(LIGNE_PRELEVEE);
            }
        }
    }

    private static void cascadeOnRollback(List<RetenueLigne> rows) {
        for (RetenueLigne l : rows) {
            if (LIGNE_PRELEVEE.equals(l.getStatut())) l.setStatut(GENEREE);
        }
    }

    private void refreshCompletedPrets(List<RetenueLigne> rows) {
        Set<Long> pretIds = new java.util.HashSet<>();
        for (RetenueLigne row : rows) {
            if ("PRET".equals(row.getType()) && row.getSourceRefId() != null) {
                pretIds.add(row.getSourceRefId());
            }
        }
        if (!pretIds.isEmpty()) {
            pretService.refreshCompletedPrets(pretIds);
        }
    }

    private void rollbackToGenereeIfExported(RetenueMensuelle r) {
        if (EXPORTEE.equalsIgnoreCase(r.getStatut())) {
            r.setStatut(GENEREE);
            r.setDateExport(null);
            retenueRepo.save(r);
        }
    }

    private RetenueMensuelle findMaster(Long id) {
        return Repos.findOrThrow(retenueRepo, id, "Retenue");
    }

    private RetenueMensuelleDto toDto(RetenueMensuelle r) {
        return RetenueMensuelleDto.from(r, ligneRepo.findByRetenueIdOrderByIdAsc(r.getId()));
    }

    private static double sumMontants(List<RetenueLigne> rows) {
        double total = 0d;
        for (RetenueLigne l : rows) total += Money.orZero(l.getMontant());
        return total;
    }

    /** Sum of montants excluding {@code ANNULEE} lignes. */
    private static double activeTotal(List<RetenueLigne> rows) {
        double total = 0d;
        for (RetenueLigne l : rows) {
            if (LIGNE_ANNULEE.equals(l.getStatut())) continue;
            total += Money.orZero(l.getMontant());
        }
        return total;
    }

    private static String requireMasterStatut(String value) {
        if (value == null) throw new IllegalArgumentException("Statut cible invalide.");
        String upper = value.toUpperCase();
        if (!MASTER_STATUTS.contains(upper)) {
            throw new IllegalArgumentException("Statut cible invalide.");
        }
        return upper;
    }

    private static String requireLigneStatut(String value) {
        if (value == null) throw new IllegalArgumentException("Statut de ligne invalide.");
        String upper = value.toUpperCase();
        if (!LIGNE_STATUTS.contains(upper)) {
            throw new IllegalArgumentException("Statut de ligne invalide.");
        }
        return upper;
    }

    /** (mois, annee) defaulting to the current month when missing/invalid. */
    private record Period(int mois, int annee) {
        static Period coerce(Integer mois, Integer annee) {
            YearMonth now = YearMonth.now();
            int m = (mois == null || mois < 1 || mois > 12) ? now.getMonthValue() : mois;
            int y = (annee == null || annee < 2000) ? now.getYear() : annee;
            return new Period(m, y);
        }
    }
}
