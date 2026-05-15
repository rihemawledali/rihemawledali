package com.project_pfe_srt.project_srt.adherent.adhesion.service;

import com.project_pfe_srt.project_srt.adherent.adhesion.dto.AdhesionDto;
import com.project_pfe_srt.project_srt.adherent.adhesion.dto.AdhesionRequest;
import com.project_pfe_srt.project_srt.adherent.adhesion.entity.Adhesion;
import com.project_pfe_srt.project_srt.adherent.adhesion.repository.AdhesionRepository;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;
import com.project_pfe_srt.project_srt.common.util.DateParser;
import com.project_pfe_srt.project_srt.common.util.Repos;
import com.project_pfe_srt.project_srt.treasurer.retenue.service.RetenueService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdhesionService {

    /** Fixed monthly cotisation automatically retained on every adhérent's paie. */
    public static final double COTISATION_MENSUELLE = 30d;

    private final AdhesionRepository adhesionRepository;
    private final RetenueService retenueService;
    private final UserRepository userRepository;


    @Transactional(readOnly = true)
    public List<AdhesionDto> listAll() {
        return adhesionRepository.findAllByOrderByDateDebutDesc()
                .stream().map(AdhesionDto::from).toList();
    }

    @Transactional(readOnly = true)
    public AdhesionDto getById(Long id) {
        return AdhesionDto.from(findAdhesion(id));
    }

    @Transactional
    public AdhesionDto valider(Long id) {
        Adhesion a = findAdhesion(id);
        if (!"en_attente".equalsIgnoreCase(a.getStatut())) {
            throw new IllegalArgumentException("Adhésion non en attente.");
        }
        // Enforce the agreed monthly cotisation — 30 DT — regardless of what
        // the adhérent submitted on the demande.
        User adherent = a.getAdherent();
        if (adherent != null) {
            adhesionRepository
                    .findFirstByAdherentIdAndStatutOrderByDateDebutDesc(adherent.getId(), "active")
                    .filter(previous -> !previous.getId().equals(a.getId()))
                    .ifPresent(previous -> {
                        previous.setStatut("expiree");
                        adhesionRepository.save(previous);
                    });
        }
        a.setMontantCotisation(COTISATION_MENSUELLE);
        a.setStatut("active");
        Adhesion saved = adhesionRepository.save(a);

        // Activate the user account: signup is the adhésion demande, so the
        // account stays INACTIF (cannot log in) until the trésorier validates.
        adherent = saved.getAdherent();
        if (adherent != null && !"ACTIF".equalsIgnoreCase(adherent.getStatut())) {
            adherent.setStatut("ACTIF");
            userRepository.save(adherent);
        }

        // Refresh the current-month retenue so the new cotisation line is
        // picked up immediately (no-op if the master is already frozen past
        // GENEREE for this month).
        LocalDate today = LocalDate.now();
        try {
            retenueService.refreshForAdherent(saved.getAdherent(), today.getMonthValue(), today.getYear());
        } catch (RuntimeException ignore) {
            // Don't fail the validation if retenue generation hits a snag —
            // the trésorier can regenerate manually from the retenues page.
        }
        return AdhesionDto.from(saved);
    }

    @Transactional
    public AdhesionDto rejeter(Long id) {
        Adhesion a = findAdhesion(id);
        if (!"en_attente".equalsIgnoreCase(a.getStatut())) {
            throw new IllegalArgumentException("Adhésion non en attente.");
        }
        a.setStatut("rejetee");
        return AdhesionDto.from(adhesionRepository.save(a));
    }

    @Transactional(readOnly = true)
    public AdhesionDto getCurrent(User user) {
        return adhesionRepository
                .findFirstByAdherentIdAndStatutOrderByDateDebutDesc(user.getId(), "active")
                .map(AdhesionDto::from)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<AdhesionDto> getHistory(User user) {
        return adhesionRepository.findByAdherentIdOrderByDateDebutDesc(user.getId())
                .stream().map(AdhesionDto::from).toList();
    }

    @Transactional
    public AdhesionDto create(User user, AdhesionRequest req) {
        // Any active or already-pending adhésion blocks a new request.
        adhesionRepository.findFirstByAdherentIdAndStatutOrderByDateDebutDesc(user.getId(), "active")
                .ifPresent(x -> { throw new IllegalArgumentException("Vous avez déjà une adhésion active."); });
        adhesionRepository.findFirstByAdherentIdAndStatutOrderByDateDebutDesc(user.getId(), "en_attente")
                .ifPresent(x -> { throw new IllegalArgumentException("Une demande d'adhésion est déjà en attente de validation."); });

        LocalDate today = LocalDate.now();
        LocalDate dDebut = DateParser.parseIsoDateOrDefault(
                req == null ? null : req.getDateDebut(), today.withDayOfMonth(1));
        LocalDate dFin = DateParser.parseIsoDateOrDefault(
                req == null ? null : req.getDateFin(), dDebut.plusMonths(12).minusDays(1));
        if (!dFin.isAfter(dDebut)) {
            throw new IllegalArgumentException("La date de fin doit être après la date de début.");
        }
        // Cotisation is fixed at the institutional rate — any montant passed
        // in the request body is ignored so the adhérent cannot negotiate it.
        Adhesion a = Adhesion.builder()
                .adherent(user)
                .dateDebut(dDebut)
                .dateFin(dFin)
                .montantCotisation(COTISATION_MENSUELLE)
                .statut("en_attente")
                .build();
        return AdhesionDto.from(adhesionRepository.save(a));
    }

    @Transactional
    public AdhesionDto cancel(User user) {
        Adhesion current = adhesionRepository
                .findFirstByAdherentIdAndStatutOrderByDateDebutDesc(user.getId(), "active")
                .orElseThrow(() -> new IllegalArgumentException("Aucune adhésion active à annuler."));
        current.setStatut("expiree");
        return AdhesionDto.from(adhesionRepository.save(current));
    }

    @Transactional
    public AdhesionDto renew(User user) {
        // A pending renewal blocks a new one — the trésorier must decide first.
        adhesionRepository.findFirstByAdherentIdAndStatutOrderByDateDebutDesc(user.getId(), "en_attente")
                .ifPresent(x -> { throw new IllegalArgumentException("Une demande de renouvellement est déjà en attente."); });

        LocalDate today = LocalDate.now();
        LocalDate dDebut = today.withDayOfMonth(1);
        LocalDate dFin = dDebut.plusMonths(12).minusDays(1);

        Adhesion fresh = Adhesion.builder()
                .adherent(user)
                .dateDebut(dDebut)
                .dateFin(dFin)
                .montantCotisation(COTISATION_MENSUELLE)
                .statut("en_attente")
                .build();
        return AdhesionDto.from(adhesionRepository.save(fresh));
    }

    // ---- helpers --------------------------------------------------------

    private Adhesion findAdhesion(Long id) {
        return Repos.findOrThrow(adhesionRepository, id, "Adhésion");
    }
}
