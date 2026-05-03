package com.project_pfe_srt.project_srt.repository;

import com.project_pfe_srt.project_srt.entity.RetenueMensuelle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RetenueMensuelleRepository extends JpaRepository<RetenueMensuelle, Long> {

    Optional<RetenueMensuelle> findByAdherentIdAndMoisAndAnnee(Long adherentId, Integer mois, Integer annee);

    List<RetenueMensuelle> findByMoisAndAnneeOrderByIdAsc(Integer mois, Integer annee);

    List<RetenueMensuelle> findAllByOrderByAnneeDescMoisDescIdAsc();

    long countByStatut(String statut);
}
