package com.project_pfe_srt.project_srt.treasurer.workflow.service;

import com.project_pfe_srt.project_srt.adherent.convention.dto.ConventionDemandeDto;
import com.project_pfe_srt.project_srt.adherent.convention.entity.ConventionDemande;
import com.project_pfe_srt.project_srt.adherent.convention.repository.ConventionDemandeRepository;
import com.project_pfe_srt.project_srt.common.util.Repos;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

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
        if (!isSubmitted(d.getStatut())) {
            throw new IllegalArgumentException("Seules les demandes soumises peuvent etre validees.");
        }
        d.setStatut("APPROUVEE");
        d.setDateDecision(LocalDate.now());
        d.setMotifRefus(null);
        return ConventionDemandeDto.from(demandeRepository.save(d));
    }

    @Transactional
    public ConventionDemandeDto refuser(Long id, String motif) {
        ConventionDemande d = findOrThrow(id);
        if (!isSubmitted(d.getStatut())) {
            throw new IllegalArgumentException("Seules les demandes soumises peuvent etre refusees.");
        }
        d.setStatut("REFUSEE");
        d.setDateDecision(LocalDate.now());
        d.setMotifRefus(motif);
        return ConventionDemandeDto.from(demandeRepository.save(d));
    }

    private ConventionDemande findOrThrow(Long id) {
        return Repos.findOrThrow(demandeRepository, id, "Demande de convention");
    }

    private static boolean isSubmitted(String statut) {
        return "SOUMISE".equalsIgnoreCase(statut) || "en_attente".equalsIgnoreCase(statut);
    }
}
