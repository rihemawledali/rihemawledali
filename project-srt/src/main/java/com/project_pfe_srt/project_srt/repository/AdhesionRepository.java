package com.project_pfe_srt.project_srt.repository;

import com.project_pfe_srt.project_srt.entity.Adhesion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdhesionRepository extends JpaRepository<Adhesion, Long> {
    List<Adhesion> findByAdherentIdOrderByDateDebutDesc(Long adherentId);
    Optional<Adhesion> findFirstByAdherentIdAndStatutOrderByDateDebutDesc(Long adherentId, String statut);
    List<Adhesion> findAllByOrderByDateDebutDesc();
    long countByStatut(String statut);
}
