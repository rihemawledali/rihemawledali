package com.project_pfe_srt.project_srt.auth.service;

import com.project_pfe_srt.project_srt.adherent.adhesion.dto.AdhesionDto;
import com.project_pfe_srt.project_srt.adherent.adhesion.dto.AdhesionRequest;
import com.project_pfe_srt.project_srt.adherent.adhesion.entity.Adhesion;
import com.project_pfe_srt.project_srt.adherent.adhesion.repository.AdhesionRepository;
import com.project_pfe_srt.project_srt.adherent.adhesion.service.AdhesionService;
import com.project_pfe_srt.project_srt.auth.dto.AuthResponse;
import com.project_pfe_srt.project_srt.auth.dto.LoginRequest;
import com.project_pfe_srt.project_srt.auth.dto.RegisterRequest;
import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;

import com.project_pfe_srt.project_srt.common.util.DateParser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AdhesionRepository adhesionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AdhesionService adhesionService;

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
        };
    }

    @org.springframework.transaction.annotation.Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        // Self-registration is always an adhérent demande. Other roles
        // (admin, treasurer) are provisioned server-side only.
        Role role = Role.ADHERENT;

        User user = User.builder()
                .nom(request.getLastName())
                .prenom(request.getFirstName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .telephone(request.getPhone())
                .statut("INACTIF") // Pending admin validation of the adhesion demande
                .build();

        user = userRepository.save(user);

        // Signup IS the adhésion demande: create a pending adhesion so it
        // lands in the admin "Demandes d'adhesion" queue immediately.
        // When the admin validates it, AdhesionService.valider() will
        // activate both the adhesion and the user account.
        create(user, null);

        // No JWT issued: account is INACTIF and must be approved by an admin.
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

    @Transactional
    public AdhesionDto create(User user, AdhesionRequest request) {
        ensureNoActiveOrPendingAdhesion(user);

        LocalDate today = LocalDate.now();
        LocalDate dateDebut = DateParser.parseIsoDateOrDefault(
                request == null ? null : request.getDateDebut(), today.withDayOfMonth(1));
        LocalDate dateFin = DateParser.parseIsoDateOrDefault(
                request == null ? null : request.getDateFin(), dateDebut.plusMonths(12).minusDays(1));
        if (!dateFin.isAfter(dateDebut)) {
            throw new IllegalArgumentException("La date de fin doit être après la date de début.");
        }

        Adhesion adhesion = Adhesion.builder()
                .adherent(user)
                .dateDebut(dateDebut)
                .dateFin(dateFin)
                .montantCotisation(30d)
                .statut("en_attente")
                .build();
        return AdhesionDto.from(adhesionRepository.save(adhesion));
    }

    private void ensureNoActiveOrPendingAdhesion(User user) {
        adhesionRepository.findFirstByAdherentIdAndStatutOrderByDateDebutDesc(user.getId(), "active")
                .ifPresent(adhesion -> {
                    throw new IllegalArgumentException("Vous avez déjà une adhésion active.");
                });
        adhesionRepository.findFirstByAdherentIdAndStatutOrderByDateDebutDesc(user.getId(), "en_attente")
                .ifPresent(adhesion -> {
                    throw new IllegalArgumentException("Une demande d'adhésion est déjà en attente de validation.");
                });
    }

}
