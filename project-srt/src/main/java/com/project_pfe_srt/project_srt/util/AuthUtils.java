package com.project_pfe_srt.project_srt.util;

import com.project_pfe_srt.project_srt.entity.Role;
import com.project_pfe_srt.project_srt.entity.User;
import com.project_pfe_srt.project_srt.repository.UserRepository;
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
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Utilisateur introuvable."));
    }

    /** Returns the current user, asserting they have the ADHERENT role. */
    public User currentAdherent() {
        User u = currentUser();
        if (u.getRole() != Role.ADHERENT) {
            throw new AccessDeniedException("Réservé aux adhérents.");
        }
        return u;
    }

    /** Returns the current user, asserting they have the TRESORIER role. */
    public User currentTresorier() {
        User u = currentUser();
        if (u.getRole() != Role.TRESORIER) {
            throw new AccessDeniedException("Réservé au trésorier.");
        }
        return u;
    }

    /** Display name "Prénom Nom" of the current user, or "Système" if missing. */
    public String currentDisplayName() {
        try {
            User u = currentUser();
            String prenom = u.getPrenom() == null ? "" : u.getPrenom();
            String nom = u.getNom() == null ? "" : u.getNom();
            String full = (prenom + " " + nom).trim();
            return full.isEmpty() ? u.getEmail() : full;
        } catch (Exception e) {
            return "Système";
        }
    }
}
