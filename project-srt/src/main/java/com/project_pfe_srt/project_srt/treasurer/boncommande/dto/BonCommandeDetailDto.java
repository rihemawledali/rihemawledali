package com.project_pfe_srt.project_srt.treasurer.boncommande.dto;

import com.project_pfe_srt.project_srt.treasurer.boncommande.entity.BonCommande;
import com.project_pfe_srt.project_srt.treasurer.ticket.dto.TicketDto;

import lombok.*;

import java.util.List;

/**
 * Detail view for a BonCommande = stock row + its generated tickets.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BonCommandeDetailDto {
    private BonCommandeDto bon;
    private List<TicketDto> tickets;
}
