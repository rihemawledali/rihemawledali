package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.dto.PaiementRequest;
import com.project_pfe_srt.project_srt.dto.WorkflowDecisionRequest;
import com.project_pfe_srt.project_srt.service.AdhesionService;
import com.project_pfe_srt.project_srt.service.IndemniteService;
import com.project_pfe_srt.project_srt.service.PaiementService;
import com.project_pfe_srt.project_srt.service.PretService;
import com.project_pfe_srt.project_srt.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Read-only listings + workflow operations on adhesions / prêts / indemnités
 * for the trésorier.
 */
@RestController
@RequestMapping("/api/treasurer")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TRESORIER','ADMIN')")
public class TreasurerWorkflowController {

    private final AdhesionService adhesionService;
    private final PretService pretService;
    private final IndemniteService indemniteService;
    private final PaiementService paiementService;
    private final AuthUtils authUtils;

    // ---- Adhésions ----

    @GetMapping("/adhesions")
    public ResponseEntity<?> listAdhesions() {
        return ResponseEntity.ok(adhesionService.listAll());
    }

    @GetMapping("/adhesions/{id}")
    public ResponseEntity<?> getAdhesion(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adhesionService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/adhesions/{id}/valider")
    public ResponseEntity<?> validerAdhesion(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adhesionService.valider(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/adhesions/{id}/rejeter")
    public ResponseEntity<?> rejeterAdhesion(@PathVariable Long id,
                                             @RequestBody(required = false) WorkflowDecisionRequest body) {
        try {
            // motif kept in the request body for future use; service ignores it for now.
            String _ignored = body == null ? null : body.getMotif();
            if (_ignored != null) { /* reserved for future audit log */ }
            return ResponseEntity.ok(adhesionService.rejeter(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Prêts ----

    @GetMapping("/prets")
    public ResponseEntity<?> listPrets() {
        return ResponseEntity.ok(pretService.listAll());
    }

    @GetMapping("/prets/{id}")
    public ResponseEntity<?> getPret(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(pretService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/prets/{id}/valider")
    public ResponseEntity<?> validerPret(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(pretService.valider(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/prets/{id}/rejeter")
    public ResponseEntity<?> rejeterPret(@PathVariable Long id,
                                         @RequestBody(required = false) WorkflowDecisionRequest body) {
        try {
            String motif = body == null ? null : body.getMotif();
            return ResponseEntity.ok(pretService.rejeter(id, motif));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ---- Indemnités ----

    @GetMapping("/indemnites")
    public ResponseEntity<?> listIndemnites() {
        return ResponseEntity.ok(indemniteService.listAll());
    }

    @GetMapping("/indemnites/{id}")
    public ResponseEntity<?> getIndemnite(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(indemniteService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/indemnites/{id}/valider")
    public ResponseEntity<?> validerIndemnite(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(indemniteService.valider(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/indemnites/{id}/rejeter")
    public ResponseEntity<?> rejeterIndemnite(@PathVariable Long id,
                                              @RequestBody(required = false) WorkflowDecisionRequest body) {
        try {
            String motif = body == null ? null : body.getMotif();
            return ResponseEntity.ok(indemniteService.rejeter(id, motif));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/indemnites/{id}/annuler")
    public ResponseEntity<?> annulerIndemnite(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(indemniteService.annuler(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Pay a validated indemnité. */
    @PostMapping("/indemnites/{id}/payer")
    public ResponseEntity<?> payerIndemnite(@PathVariable Long id, @RequestBody PaiementRequest req) {
        try {
            return ResponseEntity.ok(paiementService.payIndemnite(id, req, authUtils.currentDisplayName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
