package com.project_pfe_srt.project_srt.admin.adhesions.service;

import com.project_pfe_srt.project_srt.adherent.adhesion.dto.AdhesionDto;
import com.project_pfe_srt.project_srt.adherent.adhesion.entity.Adhesion;
import com.project_pfe_srt.project_srt.adherent.adhesion.repository.AdhesionRepository;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;
import com.project_pfe_srt.project_srt.treasurer.retenue.service.RetenueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

    @Service
    @RequiredArgsConstructor
    public class AdminAdhesionsService {

        public static final double COTISATION_MENSUELLE = 30d;

        private final AdhesionRepository adhesionRepository;
        private final RetenueService retenueService;
        private final UserRepository userRepository;

        @Transactional(readOnly = true)
        public List<AdhesionDto> listAll() {
            return adhesionRepository.findAllByOrderByDateDebutDesc().stream()
                    .map(AdhesionDto::from)
                    .toList();
        }

        @Transactional(readOnly = true)
        public AdhesionDto getById(Long id) {
            return AdhesionDto.from(findAdhesion(id));
        }

        @Transactional
        public AdhesionDto valider(Long id) {
            Adhesion adhesion = findAdhesion(id);
            if (!"en_attente".equalsIgnoreCase(adhesion.getStatut())) {
                throw new IllegalArgumentException("Adhésion non en attente.");
            }

            User adherent = adhesion.getAdherent();
            expirePreviousActiveAdhesion(adherent, adhesion.getId());

            adhesion.setMontantCotisation(COTISATION_MENSUELLE);
            adhesion.setStatut("active");
            Adhesion saved = adhesionRepository.save(adhesion);

            activateAdherentAccount(saved.getAdherent());
            refreshCurrentMonthRetenue(saved.getAdherent());

            return AdhesionDto.from(saved);
        }

        @Transactional
        public AdhesionDto rejeter(Long id) {
            Adhesion adhesion = findAdhesion(id);
            if (!"en_attente".equalsIgnoreCase(adhesion.getStatut())) {
                throw new IllegalArgumentException("Adhésion non en attente.");
            }
            adhesion.setStatut("rejetee");
            return AdhesionDto.from(adhesionRepository.save(adhesion));
        }

        private void expirePreviousActiveAdhesion(User adherent, Long newAdhesionId) {
            if (adherent == null) {
                return;
            }
            adhesionRepository
                    .findFirstByAdherentIdAndStatutOrderByDateDebutDesc(adherent.getId(), "active")
                    .filter(previous -> !previous.getId().equals(newAdhesionId))
                    .ifPresent(previous -> {
                        previous.setStatut("expiree");
                        adhesionRepository.save(previous);
                    });
        }

        private void activateAdherentAccount(User adherent) {
            if (adherent != null && !"ACTIF".equalsIgnoreCase(adherent.getStatut())) {
                adherent.setStatut("ACTIF");
                userRepository.save(adherent);
            }
        }

        private void refreshCurrentMonthRetenue(User adherent) {
            if (adherent == null) {
                return;
            }
            LocalDate today = LocalDate.now();
            try {
                retenueService.refreshForAdherent(adherent, today.getMonthValue(), today.getYear());
            } catch (RuntimeException ignored) {
                // Retenue generation can be retried manually from the treasurer page.
            }
        }

        private Adhesion findAdhesion(Long id) {
            return adhesionRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Adhésion introuvable avec l'id: " + id));
        }
}
