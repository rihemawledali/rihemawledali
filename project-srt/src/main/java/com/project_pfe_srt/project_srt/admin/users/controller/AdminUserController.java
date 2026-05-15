package com.project_pfe_srt.project_srt.admin.users.controller;

import com.project_pfe_srt.project_srt.admin.users.dto.AdminUserRequest;
import com.project_pfe_srt.project_srt.admin.users.service.AdminUserService;
import com.project_pfe_srt.project_srt.auth.dto.UserDto;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<List<UserDto>> listUsers() {
        return ResponseEntity.ok(adminUserService.listUsers());
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<UserDto> activate(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.activate(id));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<UserDto> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.deactivate(id));
    }

    @PostMapping
    public ResponseEntity<UserDto> create(@Valid @RequestBody AdminUserRequest request) {
        return ResponseEntity.ok(adminUserService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDto> update(@PathVariable Long id, @RequestBody AdminUserRequest request) {
        return ResponseEntity.ok(adminUserService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.delete(id));
    }
}
