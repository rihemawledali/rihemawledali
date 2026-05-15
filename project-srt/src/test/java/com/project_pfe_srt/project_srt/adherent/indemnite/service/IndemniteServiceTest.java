package com.project_pfe_srt.project_srt.adherent.indemnite.service;

import com.project_pfe_srt.project_srt.adherent.indemnite.dto.IndemniteRequest;
import com.project_pfe_srt.project_srt.adherent.indemnite.repository.IndemniteRepository;
import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.shared.file.entity.Attachment;
import com.project_pfe_srt.project_srt.shared.file.repository.AttachmentRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Collection;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IndemniteServiceTest {

    @Mock
    private IndemniteRepository indemniteRepository;

    @Mock
    private AttachmentRepository attachmentRepository;

    @InjectMocks
    private IndemniteService indemniteService;

    @Test
    void createRejectsDuplicateOpenIndemniteOfSameType() {
        User adherent = adherent();
        when(indemniteRepository.existsByAdherentIdAndTypeAndStatutIn(eq(1L), eq("maladie"), anyCollection()))
                .thenReturn(true);

        assertThatThrownBy(() -> indemniteService.create(adherent, validRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Une indemnite de ce type est deja en cours de traitement.");
    }

    @Test
    void createRejectsShortMotif() {
        IndemniteRequest request = validRequest();
        request.setMotif("abc");

        assertThatThrownBy(() -> indemniteService.create(adherent(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Motif trop court (minimum 5 caracteres).");
    }

    @Test
    void createRejectsAmountAboveMaximum() {
        IndemniteRequest request = validRequest();
        request.setMontant(1000.01d);

        assertThatThrownBy(() -> indemniteService.create(adherent(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Montant indemnite plafonne a 1000 TND.");
    }

    @Test
    void createRejectsAttachmentOwnedByAnotherUser() {
        IndemniteRequest request = validRequest();
        request.setAttachmentId(99L);
        when(indemniteRepository.existsByAdherentIdAndTypeAndStatutIn(eq(1L), eq("maladie"), anyCollection()))
                .thenReturn(false);
        when(attachmentRepository.findById(99L)).thenReturn(Optional.of(Attachment.builder()
                .id(99L)
                .fileName("proof.pdf")
                .storagePath("proof.pdf")
                .contentType("application/pdf")
                .size(100L)
                .uploadedBy(2L)
                .build()));

        assertThatThrownBy(() -> indemniteService.create(adherent(), request))
                .isInstanceOf(AccessDeniedException.class);
    }

    private static IndemniteRequest validRequest() {
        return IndemniteRequest.builder()
                .type("maladie")
                .montant(500d)
                .motif("Motif valide")
                .build();
    }

    private static User adherent() {
        return User.builder()
                .id(1L)
                .nom("Ben Salah")
                .prenom("Ali")
                .email("ali@srt.test")
                .role(Role.ADHERENT)
                .statut("ACTIF")
                .build();
    }

    @SuppressWarnings("unchecked")
    private static Collection<String> anyCollection() {
        return any(Collection.class);
    }
}
