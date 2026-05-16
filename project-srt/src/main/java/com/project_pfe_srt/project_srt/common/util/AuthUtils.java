package com.project_pfe_srt.project_srt.common.util;

import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class AuthUtils {

    private final UserRepository userRepository;

    public AuthUtils(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Returns the currently authenticated user, or throws if anonymous. */
    public User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            throw new AccessDeniedException("Authentification requise.");
        }
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Utilisateur introuvable."));
        if (!user.isEnabled()) {
            throw new AccessDeniedException("Compte inactif.");
        }
        return user;
    }

    public User currentAdherent() {
        User u = currentUser();
        if (u.getRole() != Role.ADHERENT) {
            throw new AccessDeniedException("Réservé aux adhérents.");
        }
        return u;
    }

    /** Display name "Prénom Nom" of the current user, or "Système" if missing. */
    public String currentDisplayName() {
        try {
            return UserNames.displayName(currentUser());
        } catch (AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            return "Système";
        }
    }
}
