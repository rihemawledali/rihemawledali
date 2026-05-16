package com.project_pfe_srt.project_srt.adherent.pret.service;

import com.project_pfe_srt.project_srt.adherent.pret.dto.PretDto;
import com.project_pfe_srt.project_srt.adherent.pret.dto.PretRequest;
import com.project_pfe_srt.project_srt.adherent.pret.entity.PretSocial;
import com.project_pfe_srt.project_srt.adherent.pret.repository.PretRepository;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.common.util.Repos;
import com.project_pfe_srt.project_srt.shared.file.entity.Attachment;
import com.project_pfe_srt.project_srt.shared.file.repository.AttachmentRepository;
import com.project_pfe_srt.project_srt.treasurer.retenue.entity.RetenueLigne;
import com.project_pfe_srt.project_srt.treasurer.retenue.repository.RetenueLigneRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PretService {

    /** Minimum loan amount, in TND. */
    private static final double MIN_MONTANT = 100d;
    private static final int MIN_DUREE_MOIS = 3;
    private static final int MAX_DUREE_MOIS = 60;
    /** Default annual interest rate when the request omits it. */
    private static final double DEFAULT_TAUX = 2.5d;

    private static final String STATUT_EN_ATTENTE = "en_attente";
    private static final String STATUT_EN_COURS = "en_cours";
    private static final String STATUT_EN_RETARD = "en_retard";
    private static final String STATUT_REMBOURSE = "rembourse";
    private static final String TYPE_PRET = "PRET";
    private static final String LIGNE_PRELEVEE = "PRELEVEE";
    private static final Set<String> BLOCKING_STATUTS =
            Set.of(STATUT_EN_ATTENTE, STATUT_EN_COURS, STATUT_EN_RETARD);
    private static final Set<String> RUNNING_STATUTS = Set.of(STATUT_EN_COURS, STATUT_EN_RETARD);

    private final PretRepository pretRepository;
    private final AttachmentRepository attachmentRepository;
    private final RetenueLigneRepository retenueLigneRepository;

    // ---- Read -----------------------------------------------------------

    @Transactional
    public List<PretDto> listMine(User user) {
        refreshCompletedPrets(user.getId());
        List<PretSocial> prets = pretRepository.findByAdherentIdOrderByDateDemandeDesc(user.getId());
        return toDtosWithRemboursements(prets);
    }

    @Transactional
    public List<PretDto> listAll() {
        refreshCompletedPrets();
        List<PretSocial> prets = pretRepository.findAllByOrderByDateDemandeDesc();
        return toDtosWithRemboursements(prets);
    }

    @Transactional
    public PretDto getById(Long id) {
        PretSocial pret = findPret(id);
        refreshCompletedPret(pret);
        return toDtoWithRemboursements(pret);
    }

    // ---- Transitions ----------------------------------------------------

    /** en_attente → en_cours (approval). */
    @Transactional
    public PretDto valider(Long id) {
        PretSocial p = findPret(id);
        requirePending(p);
        User adherent = p.getAdherent();
        if (adherent == null) {
            throw new IllegalArgumentException("Adhérent du prêt introuvable.");
        }
        refreshCompletedPrets(adherent.getId());
        ensureNoBlockingPret(adherent.getId(), p.getId());
        p.setStatut(STATUT_EN_COURS);
        if (p.getDateAccord() == null) p.setDateAccord(LocalDate.now());
        return PretDto.from(pretRepository.save(p));
    }

    @Transactional
    public PretDto rejeter(Long id, String motif) {
        PretSocial p = findPret(id);
        requirePending(p);
        p.setStatut("rejete");
        if (motif != null && !motif.isBlank()) p.setMotif(motif);
        return PretDto.from(pretRepository.save(p));
    }

    // ---- Create ---------------------------------------------------------

    @Transactional
    public PretDto create(User user, PretRequest req) {
        refreshCompletedPrets(user.getId());
        ensureNoBlockingPret(user.getId(), null);
        if (req.getMontant() == null || req.getMontant() < MIN_MONTANT) {
            throw new IllegalArgumentException("Montant invalide (minimum " + (int) MIN_MONTANT + " TND).");
        }
        if (req.getDuree() == null || req.getDuree() < MIN_DUREE_MOIS || req.getDuree() > MAX_DUREE_MOIS) {
            throw new IllegalArgumentException(
                    "Durée invalide (" + MIN_DUREE_MOIS + " à " + MAX_DUREE_MOIS + " mois).");
        }
        Attachment att = req.getAttachmentId() == null
                ? null
                : Repos.findOrThrow(attachmentRepository, req.getAttachmentId(), "Pièce jointe");

        PretSocial p = PretSocial.builder()
                .adherent(user)
                .montant(req.getMontant())
                .duree(req.getDuree())
                .taux(req.getTaux() == null ? DEFAULT_TAUX : req.getTaux())
                .statut(STATUT_EN_ATTENTE)
                .dateDemande(LocalDate.now())
                .motif(req.getMotif())
                .attachment(att)
                .build();
        return PretDto.from(pretRepository.save(p));
    }

    // ---- Reimbursement tracking ----------------------------------------

    @Transactional
    public void refreshCompletedPrets(Long adherentId) {
        pretRepository.findByAdherentIdAndStatutInOrderByDateDemandeDesc(adherentId, RUNNING_STATUTS)
                .forEach(this::refreshCompletedPret);
    }

    @Transactional
    public void refreshCompletedPrets(Collection<Long> pretIds) {
        for (Long pretId : pretIds) {
            pretRepository.findById(pretId).ifPresent(this::refreshCompletedPret);
        }
    }

    @Transactional
    public void refreshCompletedPrets() {
        pretRepository.findByStatutIn(RUNNING_STATUTS).forEach(this::refreshCompletedPret);
    }

    public boolean refreshCompletedPret(PretSocial pret) {
        if (pret == null || pret.getId() == null || !isRunning(pret)) {
            return false;
        }
        if (!isFullyReimbursed(pret)) {
            return false;
        }
        pret.setStatut(STATUT_REMBOURSE);
        pretRepository.save(pret);
        return true;
    }

    // ---- Public helper --------------------------------------------------

    /**
     * Standard amortised monthly payment using the annuity formula.
     * Mirrors the JS {@code calculateMonthlyPayment} used by the
     * frontend so the retenue and the UI agree to the cent.
     */
    public static double calculateMonthlyPayment(double montant, int duree, double tauxAnnualPct) {
        double r = tauxAnnualPct / 100.0 / 12.0;
        if (r == 0) return montant / duree;
        return montant * r / (1 - Math.pow(1 + r, -duree));
    }

    // ---- Internals ------------------------------------------------------

    private PretSocial findPret(Long id) {
        return Repos.findOrThrow(pretRepository, id, "Prêt");
    }

    private List<PretDto> toDtosWithRemboursements(List<PretSocial> prets) {
        List<Long> pretIds = prets.stream()
                .map(PretSocial::getId)
                .filter(Objects::nonNull)
                .toList();
        if (pretIds.isEmpty()) {
            return prets.stream().map(PretDto::from).toList();
        }

        Map<Long, List<RetenueLigne>> remboursementsByPretId = retenueLigneRepository
                .findByTypeAndSourceRefIdInOrderByRetenuePeriod(TYPE_PRET, pretIds)
                .stream()
                .filter(ligne -> ligne.getSourceRefId() != null)
                .collect(Collectors.groupingBy(RetenueLigne::getSourceRefId));

        return prets.stream()
                .map(pret -> PretDto.from(pret, remboursementsByPretId.getOrDefault(pret.getId(), List.of())))
                .toList();
    }

    private PretDto toDtoWithRemboursements(PretSocial pret) {
        if (pret == null || pret.getId() == null) {
            return PretDto.from(pret);
        }
        List<RetenueLigne> remboursements = retenueLigneRepository
                .findByTypeAndSourceRefIdInOrderByRetenuePeriod(TYPE_PRET, List.of(pret.getId()));
        return PretDto.from(pret, remboursements);
    }

    private void ensureNoBlockingPret(Long adherentId, Long excludedPretId) {
        List<PretSocial> blocking = pretRepository
                .findByAdherentIdAndStatutInOrderByDateDemandeDesc(adherentId, BLOCKING_STATUTS)
                .stream()
                .filter(pret -> excludedPretId == null || !excludedPretId.equals(pret.getId()))
                .toList();
        if (!blocking.isEmpty()) {
            throw new IllegalArgumentException(
                    "Vous avez déjà un prêt actif ou une demande de prêt en attente.");
        }
    }

    private boolean isFullyReimbursed(PretSocial pret) {
        long paidInstallments = retenueLigneRepository.countByTypeAndSourceRefIdAndStatut(
                TYPE_PRET, pret.getId(), LIGNE_PRELEVEE);
        if (paidInstallments > 0) {
            return paidInstallments >= pret.getDuree();
        }

        long retainedInstallments = retenueLigneRepository.countByTypeAndSourceRefId(TYPE_PRET, pret.getId());
        if (retainedInstallments > 0) {
            return false;
        }

        return hasLegacyScheduleEnded(pret);
    }

    private static boolean hasLegacyScheduleEnded(PretSocial pret) {
        if (pret.getDateAccord() == null || pret.getDuree() == null || pret.getDuree() <= 0) {
            return false;
        }
        LocalDate lastDueDate = pret.getDateAccord().plusMonths(pret.getDuree());
        return !LocalDate.now().isBefore(lastDueDate);
    }

    private static boolean isRunning(PretSocial pret) {
        return pret.getStatut() != null && RUNNING_STATUTS.contains(pret.getStatut().toLowerCase());
    }

    private static void requirePending(PretSocial p) {
        if (!STATUT_EN_ATTENTE.equalsIgnoreCase(p.getStatut())) {
            throw new IllegalArgumentException("Prêt non en attente.");
        }
    }
}
