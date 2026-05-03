package com.project_pfe_srt.project_srt.dto;

import lombok.*;

/**
 * Generic body used by validation endpoints that need a free-text reason
 * (rejet, annulation, refus). All fields are optional — empty body is OK.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowDecisionRequest {
    private String motif;
    private String commentaire;
}
