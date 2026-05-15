package com.project_pfe_srt.project_srt.treasurer.ticket.dto;

import com.project_pfe_srt.project_srt.treasurer.ticket.entity.TicketRestaurant;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketDto {
    private String id;
    private String numero;
    private String typeBon;
    private Double montant;
    private String statut;
    private String adherentId;
    private String adherentNom;
    private String adherentMatricule;
    private String bonCommandeId;
    private String bonCommandeNumero;
    private String dateEmission;
    private String dateAttribution;
    private String dateDecision;

    public static TicketDto from(TicketRestaurant t) {
        if (t == null) return null;
        var u = t.getAdherent();
        var b = t.getBonCommande();
        return TicketDto.builder()
                .id(t.getId().toString())
                .numero(t.getNumero())
                .typeBon(t.getTypeBon())
                .montant(t.getMontant())
                .statut(t.getStatut())
                .adherentId(u == null ? null : u.getId().toString())
                .adherentNom(u == null ? null
                        : (u.getPrenom() == null ? "" : u.getPrenom() + " ") + (u.getNom() == null ? "" : u.getNom()))
                .adherentMatricule(u == null ? null : u.getMatricule())
                .bonCommandeId(b == null ? null : b.getId().toString())
                .bonCommandeNumero(b == null ? null : b.getNumero())
                .dateEmission(t.getDateEmission() == null ? null : t.getDateEmission().toString())
                .dateAttribution(t.getDateAttribution() == null ? null : t.getDateAttribution().toString())
                .dateDecision(t.getDateDecision() == null ? null : t.getDateDecision().toString())
                .build();
    }
}
