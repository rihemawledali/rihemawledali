package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.ConventionDemandeDto;
import com.project_pfe_srt.project_srt.entity.ConventionDemande;
import com.project_pfe_srt.project_srt.repository.ConventionDemandeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Treasurer-facing workflow for convention demandes:
 *   en_attente -> validee   (valider)
 *   en_attente -> refusee   (refuser, optional motif)
 *
 * Validated demandes are the ones the retenue generator uses to emit
 * monthly tranche lines when the backing convention has a priced offer
 * (`montantOffre` + `nbTranches`).
 */
@Service
@RequiredArgsConstructor
public class TreasurerConventionService {

    private final ConventionDemandeRepository demandeRepository;

    public List<ConventionDemandeDto> listDemandes() {
        return demandeRepository.findAllByOrderByDateDemandeDesc().stream()
                .map(ConventionDemandeDto::from)
                .toList();
    }

    public ConventionDemandeDto getById(Long id) {
        return ConventionDemandeDto.from(findOrThrow(id));
    }

    @Transactional
    public ConventionDemandeDto valider(Long id) {
        ConventionDemande d = findOrThrow(id);
        if (!"en_attente".equalsIgnoreCase(d.getStatut())) {
            throw new IllegalArgumentException("Seules les demandes en attente peuvent être validées.");
        }
        d.setStatut("validee");
        d.setDateDecision(LocalDate.now());
        d.setMotifRefus(null);
        return ConventionDemandeDto.from(demandeRepository.save(d));
    }

    @Transactional
    public ConventionDemandeDto refuser(Long id, String motif) {
        ConventionDemande d = findOrThrow(id);
        if (!"en_attente".equalsIgnoreCase(d.getStatut())) {
            throw new IllegalArgumentException("Seules les demandes en attente peuvent être refusées.");
        }
        d.setStatut("refusee");
        d.setDateDecision(LocalDate.now());
        d.setMotifRefus(motif);
        return ConventionDemandeDto.from(demandeRepository.save(d));
    }

    private ConventionDemande findOrThrow(Long id) {
        return demandeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Demande de convention introuvable."));
    }
}
