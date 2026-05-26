package com.project_pfe_srt.project_srt.treasurer.ticket.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketRestaurantRequest {
    private String numero;
    private String typeBon;       // restaurant | cafeteria
    private Double montant;
    private Integer quantite;
    private String statut;
    private Long adherentId;
    private String dateEmission;  // ISO yyyy-MM-dd
}
