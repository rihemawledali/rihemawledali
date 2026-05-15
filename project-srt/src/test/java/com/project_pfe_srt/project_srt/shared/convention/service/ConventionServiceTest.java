package com.project_pfe_srt.project_srt.shared.convention.service;

import com.project_pfe_srt.project_srt.shared.convention.dto.ConventionRequest;
import com.project_pfe_srt.project_srt.shared.convention.repository.ConventionRepository;
import com.project_pfe_srt.project_srt.shared.fournisseur.entity.Fournisseur;
import com.project_pfe_srt.project_srt.shared.fournisseur.repository.FournisseurRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConventionServiceTest {

    @Mock
    private ConventionRepository conventionRepository;

    @Mock
    private FournisseurRepository fournisseurRepository;

    @InjectMocks
    private ConventionService conventionService;

    @Test
    void createRejectsEndDateBeforeStartDate() {
        Fournisseur fournisseur = Fournisseur.builder().id(1L).nom("Clinique").build();
        when(fournisseurRepository.findById(1L)).thenReturn(Optional.of(fournisseur));

        ConventionRequest request = new ConventionRequest();
        request.setFournisseurId("1");
        request.setType("sante");
        request.setDateDebut("2026-05-10");
        request.setDateFin("2026-05-01");
        request.setModeAvantage("REMISE_POURCENTAGE");
        request.setTauxReduction(10d);

        assertThatThrownBy(() -> conventionService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("La date de fin doit être après la date de début.");
    }

    @Test
    void createRejectsMissingModeAvantage() {
        Fournisseur fournisseur = Fournisseur.builder().id(1L).nom("Clinique").build();
        when(fournisseurRepository.findById(1L)).thenReturn(Optional.of(fournisseur));

        ConventionRequest request = new ConventionRequest();
        request.setFournisseurId("1");
        request.setType("sante");
        request.setDateDebut("2026-05-01");
        request.setDateFin("2026-06-01");

        assertThatThrownBy(() -> conventionService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Mode d'avantage requis.");
    }
}
