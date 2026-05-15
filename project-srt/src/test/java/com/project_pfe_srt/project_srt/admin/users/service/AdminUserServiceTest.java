package com.project_pfe_srt.project_srt.admin.users.service;

import com.project_pfe_srt.project_srt.admin.users.dto.AdminUserRequest;
import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AdminUserService adminUserService;

    @Test
    void parseRoleAcceptsFrontendTreasurerName() {
        assertThat(AdminUserService.parseRole("treasurer")).isEqualTo(Role.TRESORIER);
    }

    @Test
    void parseStatutNormalizesValidValue() {
        assertThat(AdminUserService.parseStatut("actif", "INACTIF")).isEqualTo("ACTIF");
    }

    @Test
    void createRejectsDuplicateEmail() {
        AdminUserRequest request = new AdminUserRequest(
                "Ali", "Ben Salah", "ali@srt.test", "adherent", null, null, null, "secret");
        when(userRepository.existsByEmail("ali@srt.test")).thenReturn(true);

        assertThatThrownBy(() -> adminUserService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Cet email est déjà utilisé.");
    }

    @Test
    void parseRoleRejectsUnknownValue() {
        assertThatThrownBy(() -> AdminUserService.parseRole("finance"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Rôle invalide");
    }
}
