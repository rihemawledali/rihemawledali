package com.project_pfe_srt.project_srt.admin.users.service;

import com.project_pfe_srt.project_srt.admin.users.dto.AdminUserRequest;
import com.project_pfe_srt.project_srt.auth.dto.UserDto;
import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;
import com.project_pfe_srt.project_srt.common.exception.ApiException;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserDto> listUsers() {
        return userRepository.findAllByOrderByIdAsc().stream()
                .map(UserDto::from)
                .toList();
    }

    @Transactional
    public UserDto activate(Long id) {
        User user = requireUser(id);
        user.setStatut("ACTIF");
        return UserDto.from(user);
    }

    @Transactional
    public UserDto deactivate(Long id) {
        User user = requireUser(id);
        user.setStatut("INACTIF");
        return UserDto.from(user);
    }

    @Transactional
    public UserDto create(AdminUserRequest request) {
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Le mot de passe est requis.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Cet email est déjà utilisé.");
        }

        User user = User.builder()
                .nom(request.getLastName())
                .prenom(request.getFirstName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(parseRole(request.getRole()))
                .telephone(request.getPhone())
                .matricule(request.getMatricule())
                .statut(parseStatut(request.getStatut(), "ACTIF"))
                .build();

        return UserDto.from(userRepository.save(user));
    }

    @Transactional
    public UserDto update(Long id, AdminUserRequest request) {
        User user = requireUser(id);

        if (request.getFirstName() != null) {
            user.setPrenom(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setNom(request.getLastName());
        }
        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Cet email est déjà utilisé.");
            }
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            user.setTelephone(request.getPhone());
        }
        if (request.getMatricule() != null) {
            user.setMatricule(request.getMatricule());
        }
        if (request.getRole() != null) {
            user.setRole(parseRole(request.getRole()));
        }
        if (request.getStatut() != null) {
            user.setStatut(parseStatut(request.getStatut(), user.getStatut()));
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return UserDto.from(user);
    }

    @Transactional
    public Map<String, String> delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable.");
        }
        userRepository.deleteById(id);
        return Map.of("message", "Utilisateur supprimé.");
    }

    public static Role parseRole(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Le rôle est requis.");
        }
        String normalized = value.trim().toLowerCase();
        return switch (normalized) {
            case "admin" -> Role.ADMIN;
            case "adherent" -> Role.ADHERENT;
            case "treasurer", "tresorier" -> Role.TRESORIER;
            default -> throw new IllegalArgumentException(
                    "Rôle invalide. Valeurs autorisées : admin, adherent, treasurer.");
        };
    }

    public static String parseStatut(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        String normalized = value.trim().toUpperCase();
        return switch (normalized) {
            case "ACTIF", "INACTIF", "SUSPENDU" -> normalized;
            default -> throw new IllegalArgumentException(
                    "Statut invalide. Valeurs autorisées : actif, inactif, suspendu.");
        };
    }

    private User requireUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));
    }
}
