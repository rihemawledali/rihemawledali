package com.project_pfe_srt.project_srt.adherent.pret.controller;

import com.project_pfe_srt.project_srt.adherent.pret.dto.PretDto;
import com.project_pfe_srt.project_srt.adherent.pret.dto.PretRequest;
import com.project_pfe_srt.project_srt.adherent.pret.service.PretService;
import com.project_pfe_srt.project_srt.common.util.AuthUtils;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/adherent/prets")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADHERENT')")
public class AdherentPretController {

    private final PretService pretService;
    private final AuthUtils authUtils;

    @GetMapping
    public List<PretDto> list() {
        return pretService.listMine(authUtils.currentAdherent());
    }

    @PostMapping
    public PretDto create(@RequestBody PretRequest req) {
        return pretService.create(authUtils.currentAdherent(), req);
    }
}
