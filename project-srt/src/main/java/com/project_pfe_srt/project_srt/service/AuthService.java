package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.AuthResponse;
import com.project_pfe_srt.project_srt.dto.LoginRequest;
import com.project_pfe_srt.project_srt.dto.RegisterRequest;
import com.project_pfe_srt.project_srt.entity.Role;
import com.project_pfe_srt.project_srt.entity.User;
import com.project_pfe_srt.project_srt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Maps internal Role enum to frontend-friendly role string
     * TRESORIER -> treasurer (French to English)
     * Other roles just lowercase
     */
    private String mapRoleToFrontend(Role role) {
        return switch (role) {
            case TRESORIER -> "treasurer";
            case ADMIN -> "admin";
            case ADHERENT -> "adherent";
            case MANAGER -> "manager";
        };
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid role. Allowed: admin, adherent, treasurer, manager");
        }

        User user = User.builder()
                .nom(request.getLastName())
                .prenom(request.getFirstName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .telephone(request.getPhone())
                .statut("INACTIF") // Pending admin approval
                .build();

        userRepository.save(user);

        // No JWT issued: account is INACTIF and must be approved by an admin
        return AuthResponse.builder()
                .id(user.getId().toString())
                .token(null)
                .role(mapRoleToFrontend(user.getRole()))
                .email(user.getEmail())
                .firstName(user.getPrenom())
                .lastName(user.getNom())
                .phone(user.getTelephone())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .id(user.getId().toString())
                .token(token)
                .role(mapRoleToFrontend(user.getRole()))
                .email(user.getEmail())
                .firstName(user.getPrenom())
                .lastName(user.getNom())
                .phone(user.getTelephone())
                .build();
    }
}
