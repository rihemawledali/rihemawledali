package com.project_pfe_srt.project_srt.auth.service;

import com.project_pfe_srt.project_srt.auth.entity.PasswordResetCode;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.auth.repository.PasswordResetCodeRepository;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final int CODE_EXPIRATION_MINUTES = 10;
    private static final int MAX_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final PasswordResetCodeRepository resetCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public void sendResetCode(String email) {
        String normalizedEmail = normalizeEmail(email);

        userRepository.findByEmailIgnoreCase(normalizedEmail)
                .ifPresent(user -> sendResetCodeToExistingUser(user, normalizedEmail));
    }

    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public void resetPassword(String email, String code, String newPassword) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Code invalide ou expire."));

        PasswordResetCode resetCode = resetCodeRepository
                .findFirstByEmailIgnoreCaseAndUsedAtIsNullOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Code invalide ou expire."));

        validateCode(resetCode, code);
        changePassword(user, newPassword);
        resetCode.setUsedAt(LocalDateTime.now());
    }

    private void sendResetCodeToExistingUser(User user, String normalizedEmail) {
        expireOldCodes(normalizedEmail);

        String code = generateCode();
        PasswordResetCode resetCode = PasswordResetCode.builder()
                .email(normalizedEmail)
                .codeHash(passwordEncoder.encode(code))
                .expiresAt(LocalDateTime.now().plusMinutes(CODE_EXPIRATION_MINUTES))
                .build();

        resetCodeRepository.save(resetCode);
        emailService.sendPasswordResetCode(user.getEmail(), code);
    }

    private String generateCode() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    private void validateCode(PasswordResetCode resetCode, String code) {
        if (resetCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            resetCode.setUsedAt(LocalDateTime.now());
            throw new IllegalArgumentException("Code invalide ou expire.");
        }

        if (resetCode.getAttempts() >= MAX_ATTEMPTS) {
            throw new IllegalArgumentException("Trop de tentatives. Demandez un nouveau code.");
        }

        if (!passwordEncoder.matches(code, resetCode.getCodeHash())) {
            resetCode.setAttempts(resetCode.getAttempts() + 1);
            if (resetCode.getAttempts() >= MAX_ATTEMPTS) {
                resetCode.setUsedAt(LocalDateTime.now());
            }
            throw new IllegalArgumentException("Code invalide ou expire.");
        }
    }

    private void changePassword(User user, String newPassword) {
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private void expireOldCodes(String normalizedEmail) {
        LocalDateTime now = LocalDateTime.now();
        resetCodeRepository.findByEmailIgnoreCaseAndUsedAtIsNull(normalizedEmail)
                .forEach(resetCode -> resetCode.setUsedAt(now));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
