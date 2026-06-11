package com.project_pfe_srt.project_srt.adherent.adhesion.service;

import com.project_pfe_srt.project_srt.adherent.adhesion.dto.AdhesionDto;
import com.project_pfe_srt.project_srt.adherent.adhesion.entity.Adhesion;
import com.project_pfe_srt.project_srt.adherent.adhesion.repository.AdhesionRepository;
import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;
import com.project_pfe_srt.project_srt.treasurer.retenue.service.RetenueService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdhesionServiceTest {

    @Mock
    private AdhesionRepository adhesionRepository;

    @Mock
    private RetenueService retenueService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AdhesionService adhesionService;

    @Test
    void getCurrentReturnsActiveAdhesion() {
        User adherent = AliAdherent();
        Adhesion active = Adhesion.builder()
                .id(10L)
                .adherent(adherent)
                .dateDebut(LocalDate.of(2025, 1, 1))
                .dateFin(LocalDate.of(2025, 12, 31))
                .montantCotisation(AdhesionService.COTISATION_MENSUELLE)
                .statut("active")
                .build();

        when(adhesionRepository.findFirstByAdherentIdAndStatutOrderByDateDebutDesc(1L, "active"))
                .thenReturn(Optional.of(active));

        AdhesionDto result = adhesionService.getCurrent(adherent);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("10");
        assertThat(result.getStatut()).isEqualTo("active");
    }

    @Test
    void getHistoryReturnsHistory() {
        User adherent = AliAdherent();
        Adhesion active = Adhesion.builder()
                .id(10L)
                .adherent(adherent)
                .dateDebut(LocalDate.of(2025, 1, 1))
                .dateFin(LocalDate.of(2025, 12, 31))
                .montantCotisation(AdhesionService.COTISATION_MENSUELLE)
                .statut("active")
                .build();

        when(adhesionRepository.findByAdherentIdOrderByDateDebutDesc(1L))
                .thenReturn(java.util.List.of(active));

        java.util.List<AdhesionDto> result = adhesionService.getHistory(adherent);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo("10");
    }

    private static User AliAdherent() {
        return User.builder()
                .id(1L)
                .nom("Ben Salah")
                .prenom("Ali")
                .email("ali@srt.test")
                .role(Role.ADHERENT)
                .statut("ACTIF")
                .build();
    }
}
