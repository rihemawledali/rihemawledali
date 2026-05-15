package com.project_pfe_srt.project_srt.common.util;

import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthUtilsTest {

    @Mock
    private UserRepository userRepository;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void currentUserRejectsInactiveAccount() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("inactive@srt.test", null, List.of()));
        when(userRepository.findByEmail("inactive@srt.test")).thenReturn(Optional.of(User.builder()
                .id(1L)
                .nom("User")
                .prenom("Inactive")
                .email("inactive@srt.test")
                .role(Role.ADHERENT)
                .statut("INACTIF")
                .build()));

        AuthUtils authUtils = new AuthUtils(userRepository);

        assertThatThrownBy(authUtils::currentUser)
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Compte inactif.");
    }
}
