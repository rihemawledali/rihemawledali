package com.project_pfe_srt.project_srt.treasurer.ai.controller;

import com.project_pfe_srt.project_srt.treasurer.ai.dto.PretAiAnswerDto;
import com.project_pfe_srt.project_srt.treasurer.ai.dto.PretAiAskRequest;
import com.project_pfe_srt.project_srt.treasurer.ai.service.PretAiAssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/treasurer/prets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TRESORIER','ADMIN')")
public class TreasurerPretAiController {

    private final PretAiAssistantService pretAiAssistantService;

    @PostMapping("/{id}/ask-ai")
    public PretAiAnswerDto askAi(@PathVariable Long id, @Valid @RequestBody(required = false) PretAiAskRequest request) {
        return pretAiAssistantService.ask(id, request);
    }
}
