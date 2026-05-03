package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.ConventionAdherentDto;
import com.project_pfe_srt.project_srt.dto.ConventionDemandeDto;
import com.project_pfe_srt.project_srt.dto.ConventionDemandeRequest;
import com.project_pfe_srt.project_srt.entity.*;
import com.project_pfe_srt.project_srt.repository.AttachmentRepository;
import com.project_pfe_srt.project_srt.repository.ConventionDemandeRepository;
import com.project_pfe_srt.project_srt.repository.ConventionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ConventionAdherentService {

    private final ConventionRepository conventionRepository;
    private final ConventionDemandeRepository demandeRepository;
    private final AttachmentRepository attachmentRepository;

    /** Mirrors getAdherentConventionStatus from the frontend. */
    public static String adherentStatus(Convention conv,
                                        Map<Long, ConventionDemande> myDemandesByConvId,
                                        LocalDate today) {
        if (conv.getDateFin().isBefore(today) || "expiree".equals(conv.getStatut())) return "expiree";
        if ("suspendue".equals(conv.getStatut()) || "en_negociation".equals(conv.getStatut())) {
            return "non_disponible";
        }
        ConventionDemande mine = myDemandesByConvId.get(conv.getId());
        if (mine != null) {
            if ("validee".equals(mine.getStatut())) return "active";
            if ("en_attente".equals(mine.getStatut())) return "deja_demandee";
            // refusee / annulee → can request again
        }
        return "disponible";
    }

    public List<ConventionAdherentDto> listConventions(User user) {
        LocalDate today = LocalDate.now();
        Map<Long, ConventionDemande> mine = mineByConvention(user);
        return conventionRepository.findAll().stream()
                .map(c -> ConventionAdherentDto.from(c, adherentStatus(c, mine, today)))
                .toList();
    }

    public ConventionAdherentDto getConvention(User user, Long id) {
        Convention c = conventionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Convention introuvable."));
        Map<Long, ConventionDemande> mine = mineByConvention(user);
        return ConventionAdherentDto.from(c, adherentStatus(c, mine, LocalDate.now()));
    }

    public List<ConventionDemandeDto> listMyDemandes(User user) {
        return demandeRepository.findByAdherentIdOrderByDateDemandeDesc(user.getId())
                .stream().map(ConventionDemandeDto::from).toList();
    }

    public ConventionDemandeDto createDemande(User user, ConventionDemandeRequest req) {
        if (req.getConventionId() == null || req.getConventionId().isBlank()) {
            throw new IllegalArgumentException("Convention requise.");
        }
        Long convId;
        try { convId = Long.parseLong(req.getConventionId()); }
        catch (NumberFormatException e) { throw new IllegalArgumentException("ID convention invalide."); }

        Convention c = conventionRepository.findById(convId)
                .orElseThrow(() -> new IllegalArgumentException("Convention introuvable."));

        if (c.getDateFin().isBefore(LocalDate.now()) || "expiree".equals(c.getStatut())) {
            throw new IllegalArgumentException("Cette convention est expirée et ne peut plus faire l'objet d'une demande.");
        }
        if ("suspendue".equals(c.getStatut()) || "en_negociation".equals(c.getStatut())) {
            throw new IllegalArgumentException("Cette convention n'est pas disponible actuellement.");
        }
        boolean dup = demandeRepository.existsByConventionIdAndAdherentIdAndStatutIn(
                c.getId(), user.getId(), List.of("en_attente", "validee"));
        if (dup) {
            throw new IllegalArgumentException("Vous avez déjà une demande active pour cette convention.");
        }

        Attachment att = null;
        if (req.getAttachmentId() != null) {
            att = attachmentRepository.findById(req.getAttachmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Pièce jointe introuvable."));
        }

        ConventionDemande d = ConventionDemande.builder()
                .convention(c)
                .adherent(user)
                .dateDemande(LocalDate.now())
                .statut("en_attente")
                .commentaire(req.getCommentaire())
                .attachment(att)
                .build();
        return ConventionDemandeDto.from(demandeRepository.save(d));
    }

    public ConventionDemandeDto cancelDemande(User user, Long demandeId) {
        ConventionDemande d = demandeRepository.findById(demandeId)
                .orElseThrow(() -> new IllegalArgumentException("Demande introuvable."));
        if (!d.getAdherent().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Demande non autorisée.");
        }
        if (!"en_attente".equals(d.getStatut())) {
            throw new IllegalArgumentException("Seules les demandes en attente peuvent être annulées.");
        }
        d.setStatut("annulee");
        d.setDateDecision(LocalDate.now());
        return ConventionDemandeDto.from(demandeRepository.save(d));
    }

    private Map<Long, ConventionDemande> mineByConvention(User user) {
        return demandeRepository.findByAdherentIdOrderByDateDemandeDesc(user.getId()).stream()
                // Keep the most recent per convention (list is already DESC).
                .collect(java.util.stream.Collectors.toMap(
                        d -> d.getConvention().getId(),
                        d -> d,
                        (a, b) -> a));
    }
}
