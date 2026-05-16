package com.project_pfe_srt.project_srt.adherent.adhesion.controller;
import com.project_pfe_srt.project_srt.adherent.adhesion.dto.AdhesionDto;
import com.project_pfe_srt.project_srt.adherent.adhesion.service.AdhesionService;
import com.project_pfe_srt.project_srt.common.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/adherent/adhesion")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADHERENT')")
public class AdherentAdhesionController {

    private final AdhesionService adhesionService;
    private final AuthUtils authUtils;

    @GetMapping
    public ResponseEntity<AdhesionDto> current() {
        return ResponseEntity.ok(adhesionService.getCurrent(authUtils.currentAdherent()));
    }

    @GetMapping("/history")
    public ResponseEntity<List<AdhesionDto>> history() {
        return ResponseEntity.ok(adhesionService.getHistory(authUtils.currentAdherent()));
    }
}