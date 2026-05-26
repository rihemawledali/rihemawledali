package com.project_pfe_srt.project_srt.adherent.convention.repository;

import com.project_pfe_srt.project_srt.adherent.convention.entity.ConventionDemande;
import com.project_pfe_srt.project_srt.shared.convention.entity.TypeAvantage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConventionDemandeRepository extends JpaRepository<ConventionDemande, Long> {
    List<ConventionDemande> findByAdherentIdOrderByDateDemandeDesc(Long adherentId);
    List<ConventionDemande> findByAdherentIdAndFactureIsNotNullOrderByIdAsc(Long adherentId);
    boolean existsByConventionIdAndAdherentIdAndStatutIn(Long conventionId, Long adherentId, List<String> statuts);

    /** Newest first — used by the treasurer dashboard. */
    List<ConventionDemande> findAllByOrderByDateDemandeDesc();

    List<ConventionDemande> findByConventionTypeAvantageAndStatutInOrderByDateDemandeDesc(
            TypeAvantage typeAvantage,
            List<String> statuts);

    List<ConventionDemande> findByConventionFournisseurIdAndStatutAndFactureIsNullOrderByDateDemandeDesc(
            Long fournisseurId,
            String statut);

    List<ConventionDemande> findByConventionFournisseurIdAndStatutInAndFactureIsNullOrderByDateDemandeDesc(
            Long fournisseurId,
            List<String> statuts);

    List<ConventionDemande> findByFactureIdOrderByIdAsc(Long factureId);

    long countByStatut(String statut);
}
