package com.project_pfe_srt.project_srt.treasurer.workflow.dto;

import lombok.*;

/** Body used by rejection endpoints. The motif is optional; an empty body is OK. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowDecisionRequest {
    private String motif;
}
