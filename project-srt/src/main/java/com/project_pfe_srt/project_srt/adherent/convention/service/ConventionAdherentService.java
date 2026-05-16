package com.project_pfe_srt.project_srt.adherent.convention.service;

import com.project_pfe_srt.project_srt.adherent.convention.dto.ConventionAdherentDto;
import com.project_pfe_srt.project_srt.adherent.convention.dto.ConventionDemandeDto;
import com.project_pfe_srt.project_srt.adherent.convention.dto.ConventionDemandeRequest;
import com.project_pfe_srt.project_srt.adherent.convention.entity.ConventionDemande;
import com.project_pfe_srt.project_srt.adherent.convention.repository.ConventionDemandeRepository;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.common.exception.NotFoundException;
import com.project_pfe_srt.project_srt.shared.convention.entity.Convention;
import com.project_pfe_srt.project_srt.shared.convention.repository.ConventionRepository;
import com.project_pfe_srt.project_srt.shared.file.entity.Attachment;
import com.project_pfe_srt.project_srt.shared.file.repository.AttachmentRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConventionAdherentService {

    private final ConventionRepository conventionRepository;
    private final ConventionDemandeRepository demandeRepository;
    private final AttachmentRepository attachmentRepository;

    // =====================================================================
    // Read
    // =====================================================================

    @Transactional(readOnly = true)
    public List<ConventionAdherentDto> listConventions(User user) {
        LocalDate today = LocalDate.now();
        Map<Long, ConventionDemande> myDemandes = latestDemandePerConvention(user);

        return conventionRepository.findAllByOrderByDateDebutDescIdDesc().stream()
                .map(conv -> ConventionAdherentDto.from(conv, resolveStatus(conv, myDemandes, today)))
                .toList();
    }

    @Transactional(readOnly = true)
    public ConventionAdherentDto getConvention(User user, Long conventionId) {
        Convention convention = findConventionById(conventionId);
        Map<Long, ConventionDemande> myDemandes = latestDemandePerConvention(user);

        return ConventionAdherentDto.from(convention, resolveStatus(convention, myDemandes, LocalDate.now()));
    }

    @Transactional(readOnly = true)
    public List<ConventionDemandeDto> listMyDemandes(User user) {
        return demandeRepository.findByAdherentIdOrderByDateDemandeDesc(user.getId())
                .stream()
                .map(ConventionDemandeDto::from)
                .toList();
    }

    // =====================================================================
    // Write
    // =====================================================================

    @Transactional
    public ConventionDemandeDto createDemande(User user, ConventionDemandeRequest req) {
        Long conventionId = parseConventionId(req.getConventionId());
        Convention convention = findConventionById(conventionId);

        validateConventionIsAvailable(convention);
        validateNoDuplicateDemande(convention.getId(), user.getId());

        Attachment attachment = findAttachmentIfPresent(req.getAttachmentId());

        ConventionDemande demande = ConventionDemande.builder()
                .convention(convention)
                .adherent(user)
                .dateDemande(LocalDate.now())
                .statut("en_attente")
                .commentaire(req.getCommentaire())
                .attachment(attachment)
                .build();

        return ConventionDemandeDto.from(demandeRepository.save(demande));
    }

    @Transactional
    public ConventionDemandeDto cancelDemande(User user, Long demandeId) {
        ConventionDemande demande = findDemandeById(demandeId);

        if (!demande.getAdherent().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Demande non autorisée.");
        }
        if (!"en_attente".equals(demande.getStatut())) {
            throw new IllegalArgumentException("Seules les demandes en attente peuvent être annulées.");
        }

        demande.setStatut("annulee");
        demande.setDateDecision(LocalDate.now());
        return ConventionDemandeDto.from(demandeRepository.save(demande));
    }

    // =====================================================================
    // Status resolution
    // =====================================================================

    public static String resolveStatus(Convention conv,
                                       Map<Long, ConventionDemande> myDemandesByConvId,
                                       LocalDate today) {
        if (isExpired(conv, today))     return "expiree";
        if (isUnavailable(conv))        return "non_disponible";

        ConventionDemande mine = myDemandesByConvId.get(conv.getId());
        if (mine != null) {
            if ("validee".equals(mine.getStatut()))    return "active";
            if ("en_attente".equals(mine.getStatut())) return "deja_demandee";
        }
        return "disponible";
    }

    // =====================================================================
    // Lookups
    // =====================================================================

    private Convention findConventionById(Long id) {
        return conventionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Convention introuvable."));
    }

    private ConventionDemande findDemandeById(Long id) {
        return demandeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Demande introuvable."));
    }

    private Attachment findAttachmentIfPresent(Long attachmentId) {
        if (attachmentId == null) return null;
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new NotFoundException("Pièce jointe introuvable."));
    }

    private Map<Long, ConventionDemande> latestDemandePerConvention(User user) {
        return demandeRepository.findByAdherentIdOrderByDateDemandeDesc(user.getId())
                .stream()
                .collect(Collectors.toMap(
                        d -> d.getConvention().getId(),
                        d -> d,
                        (newer, older) -> newer));
    }

    // =====================================================================
    // Validation helpers
    // =====================================================================

    private static boolean isExpired(Convention conv, LocalDate today) {
        return conv.getDateFin().isBefore(today) || "expiree".equals(conv.getStatut());
    }

    private static boolean isUnavailable(Convention conv) {
        return "suspendue".equals(conv.getStatut()) || "en_negociation".equals(conv.getStatut());
    }

    private static Long parseConventionId(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Convention requise.");
        }
        try {
            return Long.parseLong(raw);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID convention invalide.");
        }
    }

    private void validateConventionIsAvailable(Convention convention) {
        if (isExpired(convention, LocalDate.now())) {
            throw new IllegalArgumentException("Cette convention est expirée et ne peut plus faire l'objet d'une demande.");
        }
        if (isUnavailable(convention)) {
            throw new IllegalArgumentException("Cette convention n'est pas disponible actuellement.");
        }
    }

    private void validateNoDuplicateDemande(Long conventionId, Long userId) {
        boolean alreadyExists = demandeRepository.existsByConventionIdAndAdherentIdAndStatutIn(
                conventionId, userId, List.of("en_attente", "validee"));
        if (alreadyExists) {
            throw new IllegalArgumentException("Vous avez déjà une demande active pour cette convention.");
        }
    }
}
