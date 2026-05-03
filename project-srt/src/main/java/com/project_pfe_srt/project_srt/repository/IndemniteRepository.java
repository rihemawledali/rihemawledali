package com.project_pfe_srt.project_srt.repository;

import com.project_pfe_srt.project_srt.entity.Indemnite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IndemniteRepository extends JpaRepository<Indemnite, Long> {
    List<Indemnite> findByAdherentIdOrderByDateDemandeDesc(Long adherentId);
    long countByAdherentIdAndStatut(Long adherentId, String statut);
    List<Indemnite> findAllByOrderByDateDemandeDesc();
    long countByStatut(String statut);
}
