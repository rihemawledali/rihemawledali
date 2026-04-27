package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.dto.AdminUserRequest;
import com.project_pfe_srt.project_srt.dto.UserDto;
import com.project_pfe_srt.project_srt.entity.Role;
import com.project_pfe_srt.project_srt.entity.User;
import com.project_pfe_srt.project_srt.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /** Accepts "admin"/"ADMIN", "treasurer"/"TRESORIER", etc. */
    private static Role parseRole(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Le rôle est requis.");
        }
        String v = value.trim().toLowerCase();
        return switch (v) {
            case "admin" -> Role.ADMIN;
            case "adherent" -> Role.ADHERENT;
            case "treasurer", "tresorier" -> Role.TRESORIER;
            case "manager" -> Role.MANAGER;
            default -> throw new IllegalArgumentException(
                    "Rôle invalide. Valeurs autorisées : admin, adherent, treasurer, manager.");
        };
    }

    /** Normalizes statut to ACTIF / INACTIF / SUSPENDU (uppercase). */
    private static String parseStatut(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        String v = value.trim().toUpperCase();
        return switch (v) {
            case "ACTIF", "INACTIF", "SUSPENDU" -> v;
            default -> throw new IllegalArgumentException(
                    "Statut invalide. Valeurs autorisées : actif, inactif, suspendu.");
        };
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> listUsers() {
        List<UserDto> users = userRepository.findAll().stream()
                .map(UserDto::from)
                .toList();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<UserDto>> listPendingUsers() {
        List<UserDto> users = userRepository.findAll().stream()
                .filter(u -> "INACTIF".equalsIgnoreCase(u.getStatut()))
                .map(UserDto::from)
                .toList();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable Long id) {
        return userRepository.findById(id)
                .<ResponseEntity<?>>map(user -> {
                    user.setStatut("ACTIF");
                    userRepository.save(user);
                    return ResponseEntity.ok(UserDto.from(user));
                })
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Utilisateur introuvable.")));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivate(@PathVariable Long id) {
        return userRepository.findById(id)
                .<ResponseEntity<?>>map(user -> {
                    user.setStatut("INACTIF");
                    userRepository.save(user);
                    return ResponseEntity.ok(UserDto.from(user));
                })
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Utilisateur introuvable.")));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody AdminUserRequest request) {
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le mot de passe est requis."));
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cet email est déjà utilisé."));
        }
        try {
            Role role = parseRole(request.getRole());
            String statut = parseStatut(request.getStatut(), "ACTIF");

            User user = User.builder()
                    .nom(request.getLastName())
                    .prenom(request.getFirstName())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(role)
                    .telephone(request.getPhone())
                    .matricule(request.getMatricule())
                    .statut(statut)
                    .build();

            userRepository.save(user);
            return ResponseEntity.ok(UserDto.from(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody AdminUserRequest request) {
        return userRepository.findById(id)
                .<ResponseEntity<?>>map(user -> {
                    try {
                        if (request.getFirstName() != null) user.setPrenom(request.getFirstName());
                        if (request.getLastName() != null) user.setNom(request.getLastName());
                        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
                            if (userRepository.existsByEmail(request.getEmail())) {
                                return ResponseEntity.badRequest().body(Map.of("error", "Cet email est déjà utilisé."));
                            }
                            user.setEmail(request.getEmail());
                        }
                        if (request.getPhone() != null) user.setTelephone(request.getPhone());
                        if (request.getMatricule() != null) user.setMatricule(request.getMatricule());
                        if (request.getRole() != null) user.setRole(parseRole(request.getRole()));
                        if (request.getStatut() != null) user.setStatut(parseStatut(request.getStatut(), user.getStatut()));
                        if (request.getPassword() != null && !request.getPassword().isBlank()) {
                            user.setPassword(passwordEncoder.encode(request.getPassword()));
                        }
                        userRepository.save(user);
                        return ResponseEntity.ok(UserDto.from(user));
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
                    }
                })
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Utilisateur introuvable.")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("error", "Utilisateur introuvable."));
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Utilisateur supprimé."));
    }
}
