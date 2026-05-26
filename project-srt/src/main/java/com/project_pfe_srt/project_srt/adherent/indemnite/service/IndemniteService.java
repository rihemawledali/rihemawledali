package com.project_pfe_srt.project_srt.adherent.indemnite.service;

import com.project_pfe_srt.project_srt.adherent.indemnite.dto.IndemniteDto;
import com.project_pfe_srt.project_srt.adherent.indemnite.dto.IndemniteRequest;
import com.project_pfe_srt.project_srt.adherent.indemnite.entity.Indemnite;
import com.project_pfe_srt.project_srt.adherent.indemnite.repository.IndemniteRepository;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.common.util.Repos;
import com.project_pfe_srt.project_srt.common.util.Validators;
import com.project_pfe_srt.project_srt.shared.file.entity.Attachment;
import com.project_pfe_srt.project_srt.shared.file.repository.AttachmentRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class IndemniteService {

    private static final Set<String> TYPES = Set.of(
            "maladie", "naissance", "mariage", "deces", "scolarite");

    private static final String STATUT_EN_ATTENTE = "en_attente";
    private static final Set<String> OPEN_STATUTS = Set.of(STATUT_EN_ATTENTE, "approuvee");
    private static final double MAX_MONTANT = 1000d;
    private static final int MIN_MOTIF_LENGTH = 5;

    private final IndemniteRepository indemniteRepository;
    private final AttachmentRepository attachmentRepository;

    @Transactional(readOnly = true)
    public List<IndemniteDto> listMine(User user) {
        return indemniteRepository.findByAdherentIdOrderByDateDemandeDesc(user.getId())
                .stream().map(IndemniteDto::from).toList();
    }

    @Transactional
    public IndemniteDto create(User user, IndemniteRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Demande d'indemnite requise.");
        }

        String type = Validators.requireOneOfLower(TYPES, req.getType(), "Type d'indemnite");
        double montant = Validators.requirePositive(req.getMontant(), "Montant");
        if (montant > MAX_MONTANT) {
            throw new IllegalArgumentException("Montant indemnite plafonne a 1000 TND.");
        }

        String motif = Validators.requireNonBlank(req.getMotif(), "Motif");
        if (motif.length() < MIN_MOTIF_LENGTH) {
            throw new IllegalArgumentException("Motif trop court (minimum 5 caracteres).");
        }

        if (indemniteRepository.existsByAdherentIdAndTypeAndStatutIn(user.getId(), type, OPEN_STATUTS)) {
            throw new IllegalArgumentException("Une indemnite de ce type est deja en cours de traitement.");
        }

        Attachment attachment = req.getAttachmentId() == null
                ? null
                : Repos.findOrThrow(attachmentRepository, req.getAttachmentId(), "Piece jointe");
        ensureAttachmentBelongsToUser(attachment, user);

        Indemnite indemnite = Indemnite.builder()
                .adherent(user)
                .type(type)
                .montant(montant)
                .statut(STATUT_EN_ATTENTE)
                .dateDemande(LocalDate.now())
                .motif(motif)
                .attachment(attachment)
                .build();

        return IndemniteDto.from(indemniteRepository.save(indemnite));
    }

    private static void ensureAttachmentBelongsToUser(Attachment attachment, User user) {
        if (attachment == null) {
            return;
        }
        Long uploadedBy = attachment.getUploadedBy();
        if (uploadedBy == null || user == null || !uploadedBy.equals(user.getId())) {
            throw new AccessDeniedException("Piece jointe non autorisee.");
        }
    }
}
