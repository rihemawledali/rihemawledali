package com.project_pfe_srt.project_srt.common.account.service;

import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;
import com.project_pfe_srt.project_srt.auth.service.JwtService;
import com.project_pfe_srt.project_srt.common.account.dto.AccountProfileDto;
import com.project_pfe_srt.project_srt.common.account.dto.AccountPasswordRequest;
import com.project_pfe_srt.project_srt.common.account.dto.AccountProfileUpdateRequest;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AccountProfileDto getProfile(User user) {
        return AccountProfileDto.from(user, null);
    }

    @Transactional
    public AccountProfileDto updateProfile(User user, AccountProfileUpdateRequest request) {
        String email = request.getEmail().trim();
        if (!email.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Cet email est deja utilise.");
        }

        user.setPrenom(request.getFirstName().trim());
        user.setNom(request.getLastName().trim());
        user.setEmail(email);
        user.setTelephone(request.getPhone() == null ? null : request.getPhone().trim());

        User saved = userRepository.save(user);
        return AccountProfileDto.from(saved, jwtService.generateToken(saved));
    }

    @Transactional
    public void changePassword(User user, AccountPasswordRequest request) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mot de passe actuel incorrect.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
