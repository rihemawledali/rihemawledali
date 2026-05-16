package com.project_pfe_srt.project_srt.adherent.pret.service;

import com.project_pfe_srt.project_srt.adherent.pret.dto.PretDto;
import com.project_pfe_srt.project_srt.adherent.pret.dto.PretRequest;
import com.project_pfe_srt.project_srt.adherent.pret.entity.PretSocial;
import com.project_pfe_srt.project_srt.adherent.pret.repository.PretRepository;
import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.shared.file.repository.AttachmentRepository;
import com.project_pfe_srt.project_srt.treasurer.retenue.entity.RetenueLigne;
import com.project_pfe_srt.project_srt.treasurer.retenue.entity.RetenueMensuelle;
import com.project_pfe_srt.project_srt.treasurer.retenue.repository.RetenueLigneRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PretServiceTest {

    @Mock
    private PretRepository pretRepository;

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private RetenueLigneRepository retenueLigneRepository;

    @InjectMocks
    private PretService pretService;

    @ParameterizedTest
    @ValueSource(strings = {"en_attente", "en_cours", "en_retard"})
    void createRejectsExistingBlockingPret(String statut) {
        User adherent = adherent();
        PretSocial existing = pret(10L, adherent, statut);
        when(pretRepository.findByAdherentIdAndStatutInOrderByDateDemandeDesc(eq(1L), anyCollection()))
                .thenAnswer(invocation -> {
                    Collection<String> statuts = invocation.getArgument(1);
                    return statuts.contains(statut) ? List.of(existing) : List.of();
                });

        assertThatThrownBy(() -> pretService.create(adherent, validRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Vous avez déjà un prêt actif ou une demande de prêt en attente.");
    }

    @Test
    void validerRejectsWhenAnotherBlockingPretExists() {
        User adherent = adherent();
        PretSocial pending = pret(10L, adherent, "en_attente");
        PretSocial active = pret(11L, adherent, "en_cours");

        when(pretRepository.findById(10L)).thenReturn(Optional.of(pending));
        when(pretRepository.findByAdherentIdAndStatutInOrderByDateDemandeDesc(eq(1L), anyCollection()))
                .thenReturn(List.of(active))
                .thenReturn(List.of(pending, active));

        assertThatThrownBy(() -> pretService.valider(10L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Vous avez déjà un prêt actif ou une demande de prêt en attente.");
    }

    @Test
    void createRefreshesCompletedLegacyPretBeforeBlockingCheck() {
        User adherent = adherent();
        PretSocial completed = pret(10L, adherent, "en_cours");
        completed.setDateAccord(LocalDate.now().minusMonths(7));
        completed.setDuree(6);

        when(pretRepository.findByAdherentIdAndStatutInOrderByDateDemandeDesc(eq(1L), anyCollection()))
                .thenReturn(List.of(completed))
                .thenReturn(List.of());
        when(pretRepository.save(any(PretSocial.class))).thenAnswer(invocation -> {
            PretSocial pret = invocation.getArgument(0);
            if (pret.getId() == null) {
                pret.setId(20L);
            }
            return pret;
        });

        pretService.create(adherent, validRequest());

        assertThat(completed.getStatut()).isEqualTo("rembourse");
        verify(pretRepository).save(completed);
    }

    @Test
    void listMineIncludesPaymentStatusesFromRetenueLines() {
        User adherent = adherent();
        PretSocial loan = pret(10L, adherent, "en_cours");
        loan.setDateAccord(LocalDate.of(2026, 1, 5));
        RetenueMensuelle retenue = RetenueMensuelle.builder()
                .id(50L)
                .adherent(adherent)
                .mois(2)
                .annee(2026)
                .build();
        RetenueLigne ligne = RetenueLigne.builder()
                .id(100L)
                .retenue(retenue)
                .type("PRET")
                .sourceRefId(10L)
                .montant(84.45d)
                .statut("PRELEVEE")
                .libelle("Echeance pret #10")
                .build();

        when(pretRepository.findByAdherentIdAndStatutInOrderByDateDemandeDesc(eq(1L), anyCollection()))
                .thenReturn(List.of(loan));
        when(pretRepository.findByAdherentIdOrderByDateDemandeDesc(1L)).thenReturn(List.of(loan));
        when(retenueLigneRepository.findByTypeAndSourceRefIdInOrderByRetenuePeriod(eq("PRET"), anyCollection()))
                .thenReturn(List.of(ligne));

        List<PretDto> result = pretService.listMine(adherent);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getRemboursements()).singleElement()
                .satisfies(remboursement -> {
                    assertThat(remboursement.getRetenueId()).isEqualTo("50");
                    assertThat(remboursement.getDateRetenue()).isEqualTo("2026-02-01");
                    assertThat(remboursement.getMontant()).isEqualTo(84.45d);
                    assertThat(remboursement.getStatut()).isEqualTo("PRELEVEE");
                });
    }

    private static PretRequest validRequest() {
        return PretRequest.builder()
                .montant(1000d)
                .duree(12)
                .taux(2.5d)
                .motif("Motif valide")
                .build();
    }

    private static PretSocial pret(Long id, User adherent, String statut) {
        return PretSocial.builder()
                .id(id)
                .adherent(adherent)
                .montant(1000d)
                .duree(12)
                .taux(2.5d)
                .dateDemande(LocalDate.now())
                .statut(statut)
                .build();
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

    @SuppressWarnings("unchecked")
    private static <T> Collection<T> anyCollection() {
        return any(Collection.class);
    }
}
