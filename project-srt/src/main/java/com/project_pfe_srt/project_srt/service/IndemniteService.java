package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.IndemniteDto;
import com.project_pfe_srt.project_srt.dto.IndemniteRequest;
import com.project_pfe_srt.project_srt.entity.Attachment;
import com.project_pfe_srt.project_srt.entity.Indemnite;
import com.project_pfe_srt.project_srt.entity.User;
import com.project_pfe_srt.project_srt.repository.AttachmentRepository;
import com.project_pfe_srt.project_srt.repository.IndemniteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class IndemniteService {

    private static final Set<String> TYPES = Set.of("maladie", "naissance", "mariage", "deces", "scolarite");

    private final IndemniteRepository indemniteRepository;
    private final AttachmentRepository attachmentRepository;

    public List<IndemniteDto> listMine(User user) {
        return indemniteRepository.findByAdherentIdOrderByDateDemandeDesc(user.getId())
                .stream().map(IndemniteDto::from).toList();
    }

    /** Treasury-side: list every indemnité, latest first. */
    public List<IndemniteDto> listAll() {
        return indemniteRepository.findAllByOrderByDateDemandeDesc()
                .stream().map(IndemniteDto::from).toList();
    }

    public IndemniteDto getById(Long id) {
        return indemniteRepository.findById(id).map(IndemniteDto::from)
                .orElseThrow(() -> new IllegalArgumentException("Indemnité introuvable."));
    }

    /** Pending → approuvée. */
    public IndemniteDto valider(Long id) {
        Indemnite i = indemniteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Indemnité introuvable."));
        if (!"en_attente".equalsIgnoreCase(i.getStatut())) {
            throw new IllegalArgumentException("Indemnité non en attente.");
        }
        i.setStatut("approuvee");
        return IndemniteDto.from(indemniteRepository.save(i));
    }

    public IndemniteDto rejeter(Long id, String motif) {
        Indemnite i = indemniteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Indemnité introuvable."));
        if (!"en_attente".equalsIgnoreCase(i.getStatut())) {
            throw new IllegalArgumentException("Indemnité non en attente.");
        }
        i.setStatut("rejetee");
        if (motif != null && !motif.isBlank()) i.setMotif(motif);
        return IndemniteDto.from(indemniteRepository.save(i));
    }

    public IndemniteDto annuler(Long id) {
        Indemnite i = indemniteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Indemnité introuvable."));
        if ("payee".equalsIgnoreCase(i.getStatut())) {
            throw new IllegalArgumentException("Impossible d'annuler une indemnité déjà payée.");
        }
        i.setStatut("annulee");
        return IndemniteDto.from(indemniteRepository.save(i));
    }

    public IndemniteDto create(User user, IndemniteRequest req) {
        if (req.getType() == null || !TYPES.contains(req.getType().toLowerCase())) {
            throw new IllegalArgumentException("Type d'indemnité invalide.");
        }
        if (req.getMontant() == null || req.getMontant() <= 0) {
            throw new IllegalArgumentException("Montant invalide.");
        }
        Attachment att = null;
        if (req.getAttachmentId() != null) {
            att = attachmentRepository.findById(req.getAttachmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Pièce jointe introuvable."));
        }
        Indemnite i = Indemnite.builder()
                .adherent(user)
                .type(req.getType().toLowerCase())
                .montant(req.getMontant())
                .statut("en_attente")
                .dateDemande(LocalDate.now())
                .motif(req.getMotif())
                .attachment(att)
                .build();
        return IndemniteDto.from(indemniteRepository.save(i));
    }
}
