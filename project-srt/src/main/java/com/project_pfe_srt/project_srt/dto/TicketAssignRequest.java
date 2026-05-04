package com.project_pfe_srt.project_srt.dto;

import lombok.*;

/**
 * Payload for the « attribuer » operation: assign N tickets from a
 * validated bon de commande to a single adhérent.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketAssignRequest {
    private Long bonCommandeId;
    private Long adherentId;
    private Integer quantite;
}
