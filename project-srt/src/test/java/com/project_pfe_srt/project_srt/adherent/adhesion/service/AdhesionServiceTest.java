package com.project_pfe_srt.project_srt.adherent.adhesion.service;

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
    void createRejectsExistingActiveAdhesion() {
        User adherent = adherent();
        when(adhesionRepository.findFirstByAdherentIdAndStatutOrderByDateDebutDesc(1L, "active"))
                .thenReturn(Optional.of(Adhesion.builder().id(10L).adherent(adherent).statut("active").build()));

        assertThatThrownBy(() -> adhesionService.create(adherent, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Vous avez déjà une adhésion active.");
    }

    @Test
    void renewKeepsCurrentActiveAdhesionUntilPendingRenewalIsValidated() {
        User adherent = adherent();
        Adhesion active = Adhesion.builder()
                .id(10L)
                .adherent(adherent)
                .dateDebut(LocalDate.of(2025, 1, 1))
                .dateFin(LocalDate.of(2025, 12, 31))
                .montantCotisation(AdhesionService.COTISATION_MENSUELLE)
                .statut("active")
                .build();
        AtomicLong ids = new AtomicLong(20L);

        when(adhesionRepository.findFirstByAdherentIdAndStatutOrderByDateDebutDesc(1L, "en_attente"))
                .thenReturn(Optional.empty());
        when(adhesionRepository.save(any(Adhesion.class))).thenAnswer(invocation -> {
            Adhesion adhesion = invocation.getArgument(0);
            if (adhesion.getId() == null) {
                adhesion.setId(ids.incrementAndGet());
            }
            return adhesion;
        });

        adhesionService.renew(adherent);

        ArgumentCaptor<Adhesion> saved = ArgumentCaptor.forClass(Adhesion.class);
        verify(adhesionRepository).save(saved.capture());
        assertThat(active.getStatut()).isEqualTo("active");
        assertThat(saved.getValue().getStatut()).isEqualTo("en_attente");
        assertThat(saved.getValue().getMontantCotisation()).isEqualTo(AdhesionService.COTISATION_MENSUELLE);
    }

    @Test
    void validerExpiresPreviousActiveAdhesionWhenRenewalIsAccepted() {
        User adherent = adherent();
        Adhesion active = Adhesion.builder()
                .id(10L)
                .adherent(adherent)
                .dateDebut(LocalDate.of(2025, 1, 1))
                .dateFin(LocalDate.of(2025, 12, 31))
                .montantCotisation(AdhesionService.COTISATION_MENSUELLE)
                .statut("active")
                .build();
        Adhesion renewal = Adhesion.builder()
                .id(11L)
                .adherent(adherent)
                .dateDebut(LocalDate.of(2026, 1, 1))
                .dateFin(LocalDate.of(2026, 12, 31))
                .montantCotisation(AdhesionService.COTISATION_MENSUELLE)
                .statut("en_attente")
                .build();

        when(adhesionRepository.findById(11L)).thenReturn(Optional.of(renewal));
        when(adhesionRepository.findFirstByAdherentIdAndStatutOrderByDateDebutDesc(1L, "active"))
                .thenReturn(Optional.of(active));
        when(adhesionRepository.save(any(Adhesion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        adhesionService.valider(11L);

        assertThat(active.getStatut()).isEqualTo("expiree");
        assertThat(renewal.getStatut()).isEqualTo("active");
    }

    private static User adherent() {
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
