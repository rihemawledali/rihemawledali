package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.AdherentProfileDto;
import com.project_pfe_srt.project_srt.dto.ChangePasswordRequest;
import com.project_pfe_srt.project_srt.dto.ProfileUpdateRequest;
import com.project_pfe_srt.project_srt.entity.AdherentProfile;
import com.project_pfe_srt.project_srt.entity.User;
import com.project_pfe_srt.project_srt.repository.AdherentProfileRepository;
import com.project_pfe_srt.project_srt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

@Service
@RequiredArgsConstructor
public class AdherentProfileService {

    private final UserRepository userRepository;
    private final AdherentProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    public AdherentProfile getOrCreate(User user) {
        return profileRepository.findById(user.getId())
                .orElseGet(() -> {
                    AdherentProfile fresh = AdherentProfile.builder()
                            .user(user)
                            .build();
                    return profileRepository.save(fresh);
                });
    }

    public AdherentProfileDto getProfileDto(User user) {
        return AdherentProfileDto.from(user, getOrCreate(user));
    }

    public AdherentProfileDto update(User user, ProfileUpdateRequest req) {
        if (req.getNom() != null && !req.getNom().isBlank()) user.setNom(req.getNom().trim());
        if (req.getPrenom() != null && !req.getPrenom().isBlank()) user.setPrenom(req.getPrenom().trim());
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            String email = req.getEmail().trim();
            if (!email.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmail(email)) {
                    throw new IllegalArgumentException("Cet email est déjà utilisé.");
                }
                user.setEmail(email);
            }
        }
        if (req.getTelephone() != null) user.setTelephone(req.getTelephone());
        userRepository.save(user);

        AdherentProfile p = getOrCreate(user);
        if (req.getSalaire() != null) {
            if (req.getSalaire() < 0) throw new IllegalArgumentException("Le salaire doit être positif.");
            p.setSalaire(req.getSalaire());
        }
        if (req.getEnfants() != null) {
            if (req.getEnfants() < 0) throw new IllegalArgumentException("Le nombre d'enfants doit être positif.");
            p.setEnfants(req.getEnfants());
        }
        if (req.getMarie() != null) p.setMarie(req.getMarie());
        if (req.getDateNaissance() != null && !req.getDateNaissance().isBlank()) {
            try {
                p.setDateNaissance(LocalDate.parse(req.getDateNaissance().substring(0, 10)));
            } catch (DateTimeParseException | StringIndexOutOfBoundsException e) {
                throw new IllegalArgumentException("Date de naissance invalide.");
            }
        }
        profileRepository.save(p);
        return AdherentProfileDto.from(user, p);
    }

    public void changePassword(User user, ChangePasswordRequest req) {
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mot de passe actuel incorrect.");
        }
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }
}
