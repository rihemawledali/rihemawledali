package com.project_pfe_srt.project_srt.shared.convention.controller;

import com.project_pfe_srt.project_srt.shared.convention.dto.ConventionDto;
import com.project_pfe_srt.project_srt.shared.convention.dto.ConventionRequest;
import com.project_pfe_srt.project_srt.shared.convention.service.ConventionService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conventions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ConventionController {

    private final ConventionService conventionService;

    @GetMapping
    public ResponseEntity<List<ConventionDto>> list() {
        return ResponseEntity.ok(conventionService.list());
    }

    @PostMapping
    public ResponseEntity<ConventionDto> create(@RequestBody ConventionRequest request) {
        return ResponseEntity.ok(conventionService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConventionDto> update(@PathVariable Long id, @RequestBody ConventionRequest request) {
        return ResponseEntity.ok(conventionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        return ResponseEntity.ok(conventionService.delete(id));
    }
}
