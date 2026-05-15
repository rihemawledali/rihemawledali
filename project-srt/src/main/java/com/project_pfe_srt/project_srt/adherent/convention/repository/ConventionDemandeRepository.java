package com.project_pfe_srt.project_srt.adherent.convention.repository;

import com.project_pfe_srt.project_srt.adherent.convention.entity.ConventionDemande;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConventionDemandeRepository extends JpaRepository<ConventionDemande, Long> {
    List<ConventionDemande> findByAdherentIdOrderByDateDemandeDesc(Long adherentId);
    boolean existsByConventionIdAndAdherentIdAndStatutIn(Long conventionId, Long adherentId, List<String> statuts);

    /** Newest first — used by the treasurer dashboard. */
    List<ConventionDemande> findAllByOrderByDateDemandeDesc();

    long countByStatut(String statut);
}
