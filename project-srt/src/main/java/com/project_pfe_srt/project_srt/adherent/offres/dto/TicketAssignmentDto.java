package com.project_pfe_srt.project_srt.adherent.offres.dto;

import com.project_pfe_srt.project_srt.treasurer.ticket.entity.TicketRestaurant;

import lombok.*;

import java.util.Comparator;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketAssignmentDto {
    private String id;
    private String firstNumero;
    private String lastNumero;
    private String typeBon;
    private String statut;
    private int quantite;
    private Double montantUnitaire;
    private Double montantTotal;
    private String bonCommandeId;
    private String bonCommandeNumero;
    private String dateEmission;
    private String dateAttribution;
    private String dateDecision;

    public static TicketAssignmentDto from(String id, List<TicketRestaurant> tickets) {
        if (tickets == null || tickets.isEmpty()) return null;

        List<TicketRestaurant> ordered = tickets.stream()
                .sorted(Comparator.comparing(TicketRestaurant::getNumero))
                .toList();
        TicketRestaurant first = ordered.get(0);
        TicketRestaurant last = ordered.get(ordered.size() - 1);
        var bon = first.getBonCommande();
        int quantite = ordered.stream()
                .mapToInt(TicketAssignmentDto::quantityOf)
                .sum();
        double total = ordered.stream()
                .mapToDouble(t -> (t.getMontant() == null ? 0d : t.getMontant()) * quantityOf(t))
                .sum();

        return TicketAssignmentDto.builder()
                .id(id)
                .firstNumero(first.getNumero())
                .lastNumero(last.getNumero())
                .typeBon(first.getTypeBon())
                .statut(first.getStatut())
                .quantite(quantite)
                .montantUnitaire(first.getMontant())
                .montantTotal(total)
                .bonCommandeId(bon == null ? null : bon.getId().toString())
                .bonCommandeNumero(bon == null ? null : bon.getNumero())
                .dateEmission(first.getDateEmission() == null ? null : first.getDateEmission().toString())
                .dateAttribution(first.getDateAttribution() == null ? null : first.getDateAttribution().toString())
                .dateDecision(first.getDateDecision() == null ? null : first.getDateDecision().toString())
                .build();
    }

    private static int quantityOf(TicketRestaurant ticket) {
        return ticket.getQuantite() == null ? 1 : ticket.getQuantite();
    }
}
