package com.project_pfe_srt.project_srt.dto;

import com.project_pfe_srt.project_srt.entity.TicketRestaurant;
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
    private String dateEmission;

    public static TicketDto from(TicketRestaurant t) {
        if (t == null) return null;
        var u = t.getAdherent();
        return TicketDto.builder()
                .id(t.getId().toString())
                .numero(t.getNumero())
                .typeBon(t.getTypeBon())
                .montant(t.getMontant())
                .statut(t.getStatut())
                .adherentId(u == null ? null : u.getId().toString())
                .adherentNom(u == null ? null
                        : (u.getPrenom() == null ? "" : u.getPrenom() + " ") + (u.getNom() == null ? "" : u.getNom()))
                .dateEmission(t.getDateEmission() == null ? null : t.getDateEmission().toString())
                .build();
    }
}
