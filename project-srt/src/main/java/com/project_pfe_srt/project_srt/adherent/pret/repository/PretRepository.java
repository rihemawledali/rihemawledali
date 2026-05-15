package com.project_pfe_srt.project_srt.adherent.pret.repository;

import com.project_pfe_srt.project_srt.adherent.pret.entity.PretSocial;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PretRepository extends JpaRepository<PretSocial, Long> {
    List<PretSocial> findByAdherentIdOrderByDateDemandeDesc(Long adherentId);
    List<PretSocial> findByAdherentIdAndStatutInOrderByDateDemandeDesc(Long adherentId, Collection<String> statuts);
    List<PretSocial> findByStatutIn(Collection<String> statuts);
    List<PretSocial> findAllByOrderByDateDemandeDesc();
    long countByStatut(String statut);
}
