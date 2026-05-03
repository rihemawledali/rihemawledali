package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.PretDto;
import com.project_pfe_srt.project_srt.dto.PretRequest;
import com.project_pfe_srt.project_srt.entity.Attachment;
import com.project_pfe_srt.project_srt.entity.PretSocial;
import com.project_pfe_srt.project_srt.entity.User;
import com.project_pfe_srt.project_srt.repository.AttachmentRepository;
import com.project_pfe_srt.project_srt.repository.PretRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PretService {

    private final PretRepository pretRepository;
    private final AttachmentRepository attachmentRepository;

    public List<PretDto> listMine(User user) {
        return pretRepository.findByAdherentIdOrderByDateDemandeDesc(user.getId())
                .stream().map(PretDto::from).toList();
    }

    public List<PretDto> listAll() {
        return pretRepository.findAllByOrderByDateDemandeDesc()
                .stream().map(PretDto::from).toList();
    }

    public PretDto getById(Long id) {
        return pretRepository.findById(id).map(PretDto::from)
                .orElseThrow(() -> new IllegalArgumentException("Prêt introuvable."));
    }

    /** en_attente → en_cours (approval). */
    public PretDto valider(Long id) {
        PretSocial p = pretRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prêt introuvable."));
        if (!"en_attente".equalsIgnoreCase(p.getStatut())) {
            throw new IllegalArgumentException("Prêt non en attente.");
        }
        p.setStatut("en_cours");
        if (p.getDateAccord() == null) p.setDateAccord(LocalDate.now());
        return PretDto.from(pretRepository.save(p));
    }

    public PretDto rejeter(Long id, String motif) {
        PretSocial p = pretRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prêt introuvable."));
        if (!"en_attente".equalsIgnoreCase(p.getStatut())) {
            throw new IllegalArgumentException("Prêt non en attente.");
        }
        p.setStatut("rejete");
        if (motif != null && !motif.isBlank()) p.setMotif(motif);
        return PretDto.from(pretRepository.save(p));
    }

    public PretDto create(User user, PretRequest req) {
        if (req.getMontant() == null || req.getMontant() < 100) {
            throw new IllegalArgumentException("Montant invalide (minimum 100 TND).");
        }
        if (req.getDuree() == null || req.getDuree() < 3 || req.getDuree() > 60) {
            throw new IllegalArgumentException("Durée invalide (3 à 60 mois).");
        }
        Attachment att = null;
        if (req.getAttachmentId() != null) {
            att = attachmentRepository.findById(req.getAttachmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Pièce jointe introuvable."));
        }
        PretSocial p = PretSocial.builder()
                .adherent(user)
                .montant(req.getMontant())
                .duree(req.getDuree())
                .taux(req.getTaux() == null ? 2.5 : req.getTaux())
                .statut("en_attente")
                .dateDemande(LocalDate.now())
                .motif(req.getMotif())
                .attachment(att)
                .build();
        return PretDto.from(pretRepository.save(p));
    }

    /** Mirrors the JS calculateMonthlyPayment used by the frontend. */
    public static double calculateMonthlyPayment(double montant, int duree, double tauxAnnualPct) {
        double r = tauxAnnualPct / 100.0 / 12.0;
        if (r == 0) return montant / duree;
        return montant * r / (1 - Math.pow(1 + r, -duree));
    }
}
