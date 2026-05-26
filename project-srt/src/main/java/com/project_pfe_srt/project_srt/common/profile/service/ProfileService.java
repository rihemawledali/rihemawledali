package com.project_pfe_srt.project_srt.common.profile.service;

import com.project_pfe_srt.project_srt.adherent.profile.entity.AdherentProfile;
import com.project_pfe_srt.project_srt.adherent.profile.repository.AdherentProfileRepository;
import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;
import com.project_pfe_srt.project_srt.common.profile.dto.ProfileResponseDTO;
import com.project_pfe_srt.project_srt.common.profile.dto.UpdateProfileRequestDTO;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final AdherentProfileRepository adherentProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public ProfileResponseDTO getConnectedUserProfile(String email) {
        User user = requireEnabledUser(email);
        return ProfileResponseDTO.from(user, findAdherentProfile(user));
    }

    @Transactional
    public ProfileResponseDTO updateConnectedUserProfile(String email, UpdateProfileRequestDTO request) {
        User user = requireEnabledUser(email);

        user.setPrenom(request.getFirstName().trim());
        user.setNom(request.getLastName().trim());
        user.setTelephone(clean(request.getPhone()));

        updatePasswordIfRequested(user, request);

        User saved = userRepository.save(user);
        return ProfileResponseDTO.from(saved, findAdherentProfile(saved));
    }

    private void updatePasswordIfRequested(User user, UpdateProfileRequestDTO request) {
        boolean hasCurrentPassword = hasText(request.getCurrentPassword());
        boolean hasNewPassword = hasText(request.getNewPassword());

        if (!hasCurrentPassword && !hasNewPassword) {
            return;
        }
        if (!hasCurrentPassword || !hasNewPassword) {
            throw new IllegalArgumentException("Le mot de passe actuel et le nouveau mot de passe sont requis.");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mot de passe actuel incorrect.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
    }

    private User requireEnabledUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Utilisateur introuvable."));
        if (!user.isEnabled()) {
            throw new AccessDeniedException("Compte inactif.");
        }
        return user;
    }

    private AdherentProfile findAdherentProfile(User user) {
        if (user.getRole() != Role.ADHERENT) {
            return null;
        }
        return adherentProfileRepository.findById(user.getId()).orElse(null);
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
