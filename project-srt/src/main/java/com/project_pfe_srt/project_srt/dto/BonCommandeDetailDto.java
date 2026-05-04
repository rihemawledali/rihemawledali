package com.project_pfe_srt.project_srt.dto;

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
