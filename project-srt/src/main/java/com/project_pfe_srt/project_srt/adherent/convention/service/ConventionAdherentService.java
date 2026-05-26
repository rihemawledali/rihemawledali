package com.project_pfe_srt.project_srt.adherent.convention.service;

import com.project_pfe_srt.project_srt.adherent.convention.dto.ConventionAdherentDto;
import com.project_pfe_srt.project_srt.adherent.convention.dto.ConventionDemandeDto;
import com.project_pfe_srt.project_srt.adherent.convention.dto.ConventionDemandeRequest;
import com.project_pfe_srt.project_srt.adherent.convention.entity.ConventionDemande;
import com.project_pfe_srt.project_srt.adherent.convention.repository.ConventionDemandeRepository;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.shared.convention.entity.Convention;
import com.project_pfe_srt.project_srt.shared.convention.repository.ConventionRepository;
import com.project_pfe_srt.project_srt.shared.file.entity.Attachment;
import com.project_pfe_srt.project_srt.shared.file.repository.AttachmentRepository;

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

    public static String adherentStatus(Convention conv,
                                        Map<Long, ConventionDemande> myDemandesByConvId,
                                        LocalDate today) {
        if (conv.getDateFin().isBefore(today) || "expiree".equals(conv.getStatut())) {
            return "expiree";
        }

        if ("suspendue".equals(conv.getStatut()) || "en_negociation".equals(conv.getStatut())) {
            return "non_disponible";
        }

        ConventionDemande mine = myDemandesByConvId.get(conv.getId());

        if (mine != null) {
            if (isOneOf(mine.getStatut(), "validee", "APPROUVEE", "EN_COURS", "JUSTIFIEE", "VALIDEE", "FACTUREE", "PAYEE")) {
                return "active";
            }

            if (isOneOf(mine.getStatut(), "en_attente", "SOUMISE")) {
                return "deja_demandee";
            }
        }

        return "disponible";
    }

    public List<ConventionAdherentDto> listConventions(User user) {
        LocalDate today = LocalDate.now();
        Map<Long, ConventionDemande> mine = mineByConvention(user);

        return conventionRepository.findAllByOrderByDateDebutDescIdDesc()
                .stream()
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
                .stream()
                .map(ConventionDemandeDto::from)
                .toList();
    }

    public ConventionDemandeDto createDemande(User user, ConventionDemandeRequest req) {
        if (req.getConventionId() == null || req.getConventionId().isBlank()) {
            throw new IllegalArgumentException("Convention requise.");
        }

        Long convId;

        try {
            convId = Long.parseLong(req.getConventionId());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID convention invalide.");
        }

        Convention c = conventionRepository.findById(convId)
                .orElseThrow(() -> new IllegalArgumentException("Convention introuvable."));

        if (c.getDateFin().isBefore(LocalDate.now()) || "expiree".equals(c.getStatut())) {
            throw new IllegalArgumentException("Cette convention est expirée et ne peut plus faire l'objet d'une demande.");
        }

        if ("suspendue".equals(c.getStatut()) || "en_negociation".equals(c.getStatut())) {
            throw new IllegalArgumentException("Cette convention n'est pas disponible actuellement.");
        }

        boolean dup = demandeRepository.existsByConventionIdAndAdherentIdAndStatutIn(
                c.getId(),
                user.getId(),
                List.of("en_attente", "validee", "SOUMISE", "APPROUVEE", "EN_COURS", "JUSTIFIEE", "VALIDEE", "FACTUREE")
        );

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
                .statut("SOUMISE")
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

        if (!isOneOf(d.getStatut(), "en_attente", "SOUMISE")) {
            throw new IllegalArgumentException("Seules les demandes en attente peuvent être annulées.");
        }

        d.setStatut("ANNULEE");
        d.setDateDecision(LocalDate.now());

        return ConventionDemandeDto.from(demandeRepository.save(d));
    }

    private Map<Long, ConventionDemande> mineByConvention(User user) {
        return demandeRepository.findByAdherentIdOrderByDateDemandeDesc(user.getId())
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        d -> d.getConvention().getId(),
                        d -> d,
                        (a, b) -> a
                ));
    }

    private static boolean isOneOf(String value, String... expected) {
        if (value == null) return false;
        for (String item : expected) {
            if (item.equalsIgnoreCase(value)) return true;
        }
        return false;
    }
}
