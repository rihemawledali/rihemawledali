package com.project_pfe_srt.project_srt.auth.repository;

import com.project_pfe_srt.project_srt.auth.entity.PasswordResetCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, Long> {

    Optional<PasswordResetCode> findFirstByEmailIgnoreCaseAndUsedAtIsNullOrderByCreatedAtDesc(String email);

    List<PasswordResetCode> findByEmailIgnoreCaseAndUsedAtIsNull(String email);
}
