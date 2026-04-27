package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.dto.AuthResponse;
import com.project_pfe_srt.project_srt.dto.LoginRequest;
import com.project_pfe_srt.project_srt.dto.RegisterRequest;
import com.project_pfe_srt.project_srt.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (DisabledException e) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Votre compte est en attente de validation par l'administrateur.",
                    "code", "ACCOUNT_PENDING"
            ));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect."));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Échec de l'authentification."));
        }
    }
}
