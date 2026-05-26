package com.project_pfe_srt.project_srt.auth.controller;

import com.project_pfe_srt.project_srt.auth.dto.AuthResponse;
import com.project_pfe_srt.project_srt.auth.dto.ForgotPasswordRequest;
import com.project_pfe_srt.project_srt.auth.dto.LoginRequest;
import com.project_pfe_srt.project_srt.auth.dto.RegisterRequest;
import com.project_pfe_srt.project_srt.auth.dto.ResetPasswordRequest;
import com.project_pfe_srt.project_srt.auth.service.PasswordResetService;
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
    private final PasswordResetService passwordResetService;

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

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            passwordResetService.sendResetCode(request.getEmail());
            return ResponseEntity.ok(Map.of(
                    "message", "Si un compte existe avec cet email, un code de reinitialisation a ete envoye."
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", "L'envoi email n'est pas configure. Verifiez les variables SMTP du backend."
            ));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            passwordResetService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Mot de passe reinitialise avec succes."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
