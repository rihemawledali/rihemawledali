package com.project_pfe_srt.project_srt.adherent.indemnite.repository;

import com.project_pfe_srt.project_srt.adherent.indemnite.entity.Indemnite;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface IndemniteRepository extends JpaRepository<Indemnite, Long> {
    List<Indemnite> findByAdherentIdOrderByDateDemandeDesc(Long adherentId);
    boolean existsByAdherentIdAndTypeAndStatutIn(Long adherentId, String type, Collection<String> statuts);
    long countByAdherentIdAndStatut(Long adherentId, String statut);
    List<Indemnite> findAllByOrderByDateDemandeDesc();
    long countByStatut(String statut);
}
