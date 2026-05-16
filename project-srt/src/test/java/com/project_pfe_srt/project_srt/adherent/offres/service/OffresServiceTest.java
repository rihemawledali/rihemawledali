package com.project_pfe_srt.project_srt.adherent.offres.service;

import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.treasurer.boncommande.entity.BonCommande;
import com.project_pfe_srt.project_srt.treasurer.boncommande.repository.BonCommandeRepository;
import com.project_pfe_srt.project_srt.treasurer.retenue.service.RetenueService;
import com.project_pfe_srt.project_srt.treasurer.ticket.dto.TicketDto;
import com.project_pfe_srt.project_srt.treasurer.ticket.entity.TicketRestaurant;
import com.project_pfe_srt.project_srt.treasurer.ticket.repository.TicketRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OffresServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private BonCommandeRepository bonCommandeRepository;

    @Mock
    private RetenueService retenueService;

    @InjectMocks
    private OffresService offresService;

    @Test
    void acceptTicketMarksItUsedAndRefreshesCurrentRetenue() {
        User adherent = adherent(1L);
        TicketRestaurant ticket = ticket(adherent, "attribue");
        when(ticketRepository.findById(10L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(TicketRestaurant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TicketDto result = offresService.acceptTicket(adherent, 10L);

        assertThat(result.getStatut()).isEqualTo("utilise");
        assertThat(ticket.getDateDecision()).isNotNull();
        verify(retenueService).refreshForAdherent(
                adherent,
                ticket.getDateDecision().getMonthValue(),
                ticket.getDateDecision().getYear());
    }

    @Test
    void rejectTicketReturnsItToAvailableStock() {
        User adherent = adherent(1L);
        BonCommande bon = BonCommande.builder()
                .id(5L)
                .numero("BC-001")
                .quantiteTotale(3)
                .quantiteRestante(0)
                .statut("epuise")
                .build();
        TicketRestaurant ticket = ticket(adherent, "attribue");
        ticket.setBonCommande(bon);

        when(ticketRepository.findById(10L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(TicketRestaurant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TicketDto result = offresService.rejectTicket(adherent, 10L);

        assertThat(result.getStatut()).isEqualTo("en_attente");
        assertThat(ticket.getAdherent()).isNull();
        assertThat(ticket.getDateAttribution()).isNull();
        assertThat(ticket.getDateDecision()).isNull();
        assertThat(bon.getQuantiteRestante()).isEqualTo(1);
        assertThat(bon.getStatut()).isEqualTo("valide");
        verify(bonCommandeRepository).save(bon);
        verifyNoInteractions(retenueService);
    }

    @Test
    void decisionRejectsTicketOwnedByAnotherAdherent() {
        User currentAdherent = adherent(1L);
        TicketRestaurant ticket = ticket(adherent(2L), "attribue");
        when(ticketRepository.findById(10L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> offresService.acceptTicket(currentAdherent, 10L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Ce ticket ne vous est pas attribu\u00e9.");
    }

    @Test
    void decisionRejectsTicketAlreadyDecided() {
        User adherent = adherent(1L);
        TicketRestaurant ticket = ticket(adherent, "utilise");
        when(ticketRepository.findById(10L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> offresService.rejectTicket(adherent, 10L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Ce ticket a d\u00e9j\u00e0 une d\u00e9cision.");
    }

    private static TicketRestaurant ticket(User adherent, String statut) {
        return TicketRestaurant.builder()
                .id(10L)
                .numero("T-001")
                .typeBon("restaurant")
                .montant(10d)
                .statut(statut)
                .adherent(adherent)
                .dateEmission(LocalDate.now())
                .dateAttribution(LocalDate.now())
                .build();
    }

    private static User adherent(Long id) {
        return User.builder()
                .id(id)
                .nom("Ben Salah")
                .prenom("Ali")
                .email("ali" + id + "@srt.test")
                .role(Role.ADHERENT)
                .statut("ACTIF")
                .build();
    }
}
