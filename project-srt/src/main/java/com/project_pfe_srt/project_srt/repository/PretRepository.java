package com.project_pfe_srt.project_srt.repository;

import com.project_pfe_srt.project_srt.entity.PretSocial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PretRepository extends JpaRepository<PretSocial, Long> {
    List<PretSocial> findByAdherentIdOrderByDateDemandeDesc(Long adherentId);
    List<PretSocial> findAllByOrderByDateDemandeDesc();
    long countByStatut(String statut);
}
