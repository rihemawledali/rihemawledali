package com.project_pfe_srt.project_srt.treasurer.workflow.service;

import com.project_pfe_srt.project_srt.adherent.indemnite.dto.IndemniteDto;
import com.project_pfe_srt.project_srt.adherent.indemnite.entity.Indemnite;
import com.project_pfe_srt.project_srt.adherent.indemnite.repository.IndemniteRepository;
import com.project_pfe_srt.project_srt.common.util.Repos;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TreasurerIndemniteService {

    private static final String STATUT_EN_ATTENTE = "en_attente";

    private final IndemniteRepository indemniteRepository;

    @Transactional(readOnly = true)
    public List<IndemniteDto> listAll() {
        return indemniteRepository.findAllByOrderByDateDemandeDesc()
                .stream().map(IndemniteDto::from).toList();
    }

    @Transactional(readOnly = true)
    public IndemniteDto getById(Long id) {
        return IndemniteDto.from(findIndemnite(id));
    }

    @Transactional
    public IndemniteDto valider(Long id) {
        Indemnite indemnite = findIndemnite(id);
        requirePending(indemnite);
        indemnite.setStatut("approuvee");
        return IndemniteDto.from(indemniteRepository.save(indemnite));
    }

    @Transactional
    public IndemniteDto rejeter(Long id, String motif) {
        Indemnite indemnite = findIndemnite(id);
        requirePending(indemnite);
        indemnite.setStatut("rejetee");
        if (motif != null && !motif.isBlank()) {
            indemnite.setMotif(motif);
        }
        return IndemniteDto.from(indemniteRepository.save(indemnite));
    }

    @Transactional
    public IndemniteDto annuler(Long id) {
        Indemnite indemnite = findIndemnite(id);
        if ("payee".equalsIgnoreCase(indemnite.getStatut())) {
            throw new IllegalArgumentException("Impossible d'annuler une indemnite deja payee.");
        }
        indemnite.setStatut("annulee");
        return IndemniteDto.from(indemniteRepository.save(indemnite));
    }

    private Indemnite findIndemnite(Long id) {
        return Repos.findOrThrow(indemniteRepository, id, "Indemnite");
    }

    private static void requirePending(Indemnite indemnite) {
        if (!STATUT_EN_ATTENTE.equalsIgnoreCase(indemnite.getStatut())) {
            throw new IllegalArgumentException("Indemnite non en attente.");
        }
    }
}
