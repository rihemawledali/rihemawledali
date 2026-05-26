package com.project_pfe_srt.project_srt.adherent.profile.dto;

import com.project_pfe_srt.project_srt.adherent.adhesion.dto.AdhesionDto;
import com.project_pfe_srt.project_srt.adherent.pret.dto.PretDto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDto {
    private AdherentProfileDto profile;
    private AdhesionDto adhesion;
    private PretDto activeLoan;
    private long pendingIndemnities;
    private long availableOffers;
}
