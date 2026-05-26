package com.project_pfe_srt.project_srt.adherent.adhesion.service;

import com.project_pfe_srt.project_srt.adherent.adhesion.dto.AdhesionDto;
import com.project_pfe_srt.project_srt.adherent.adhesion.repository.AdhesionRepository;
import com.project_pfe_srt.project_srt.auth.entity.User;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdhesionService {

    public static final double COTISATION_MENSUELLE = 30d;

    private final AdhesionRepository adhesionRepository;

    @Transactional(readOnly = true)
    public AdhesionDto getCurrent(User user) {
        return adhesionRepository
                .findFirstByAdherentIdAndStatutOrderByDateDebutDesc(user.getId(), "active")
                .map(AdhesionDto::from)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<AdhesionDto> getHistory(User user) {
        return adhesionRepository.findByAdherentIdOrderByDateDebutDesc(user.getId()).stream()
                .map(AdhesionDto::from)
                .toList();
    }
}
