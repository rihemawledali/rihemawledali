package com.project_pfe_srt.project_srt.treasurer.workflow.controller;

import com.project_pfe_srt.project_srt.adherent.indemnite.service.IndemniteService;
import com.project_pfe_srt.project_srt.adherent.pret.service.PretService;
import com.project_pfe_srt.project_srt.treasurer.workflow.dto.WorkflowDecisionRequest;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Read-only listings + workflow operations on prêts / indemnités for
 * the trésorier. Errors are uniformly translated to HTTP responses by
 * {@code GlobalExceptionHandler}.
 */
@RestController
@RequestMapping("/api/treasurer")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TRESORIER','ADMIN')")
public class TreasurerWorkflowController {

    private final PretService pretService;
    private final IndemniteService indemniteService;

    // ---- Prêts ---------------------------------------------------------

    @GetMapping("/prets")
    public Object listPrets() {
        return pretService.listAll();
    }

    @GetMapping("/prets/{id}")
    public Object getPret(@PathVariable Long id) {
        return pretService.getById(id);
    }

    @PutMapping("/prets/{id}/valider")
    public Object validerPret(@PathVariable Long id) {
        return pretService.valider(id);
    }

    @PutMapping("/prets/{id}/rejeter")
    public Object rejeterPret(@PathVariable Long id,
                              @RequestBody(required = false) WorkflowDecisionRequest body) {
        return pretService.rejeter(id, motifOf(body));
    }

    // ---- Indemnités ----------------------------------------------------

    @GetMapping("/indemnites")
    public Object listIndemnites() {
        return indemniteService.listAll();
    }

    @GetMapping("/indemnites/{id}")
    public Object getIndemnite(@PathVariable Long id) {
        return indemniteService.getById(id);
    }

    @PutMapping("/indemnites/{id}/valider")
    public Object validerIndemnite(@PathVariable Long id) {
        return indemniteService.valider(id);
    }

    @PutMapping("/indemnites/{id}/rejeter")
    public Object rejeterIndemnite(@PathVariable Long id,
                                   @RequestBody(required = false) WorkflowDecisionRequest body) {
        return indemniteService.rejeter(id, motifOf(body));
    }

    @PutMapping("/indemnites/{id}/annuler")
    public Object annulerIndemnite(@PathVariable Long id) {
        return indemniteService.annuler(id);
    }

    // ---- helpers -------------------------------------------------------

    private static String motifOf(WorkflowDecisionRequest body) {
        return body == null ? null : body.getMotif();
    }
}
