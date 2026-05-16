package com.project_pfe_srt.project_srt.auth.controller;

import com.project_pfe_srt.project_srt.auth.dto.AuthResponse;
import com.project_pfe_srt.project_srt.auth.dto.LoginRequest;
import com.project_pfe_srt.project_srt.auth.dto.RegisterRequest;
import com.project_pfe_srt.project_srt.auth.service.AuthService;

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
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<Object> login(@Valid @RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok((Object) authService.login(request));
        } catch (DisabledException e) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Votre compte est en attente de validation par le trésorier.",
                    "code", "ACCOUNT_PENDING"
            ));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect."));
        }
    }
}
