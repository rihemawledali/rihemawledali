package com.project_pfe_srt.project_srt.dto;

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
    private String statut;
    private Long adherentId;
    private String dateEmission;  // ISO yyyy-MM-dd
}
