package com.project_pfe_srt.project_srt.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IndemniteRequest {
    private String type;
    private Double montant;
    private String motif;
    private Long attachmentId;
}
