package com.project_pfe_srt.project_srt.adherent.indemnite.controller;

import com.project_pfe_srt.project_srt.adherent.indemnite.dto.IndemniteRequest;
import com.project_pfe_srt.project_srt.adherent.indemnite.service.IndemniteService;
import com.project_pfe_srt.project_srt.common.util.AuthUtils;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/adherent/indemnites")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADHERENT')")
public class AdherentIndemniteController {

    private final IndemniteService indemniteService;
    private final AuthUtils authUtils;

    @GetMapping
    public Object list() {
        return indemniteService.listMine(authUtils.currentAdherent());
    }

    @PostMapping
    public Object create(@RequestBody IndemniteRequest req) {
        return indemniteService.create(authUtils.currentAdherent(), req);
    }
}
