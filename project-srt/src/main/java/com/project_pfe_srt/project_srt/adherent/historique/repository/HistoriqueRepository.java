package com.project_pfe_srt.project_srt.adherent.historique.repository;

import com.project_pfe_srt.project_srt.adherent.historique.entity.HistoriqueFinanciere;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface HistoriqueRepository extends JpaRepository<HistoriqueFinanciere, Long> {

    List<HistoriqueFinanciere> findByAdherentIdOrderByDateDesc(Long adherentId);

    @Query("""
           SELECT h FROM HistoriqueFinanciere h
           WHERE h.adherent.id = :adherentId
             AND (:type IS NULL OR h.type = :type)
             AND (:from IS NULL OR h.date >= :from)
             AND (:to IS NULL OR h.date <= :to)
           ORDER BY h.date DESC
           """)
    List<HistoriqueFinanciere> search(@Param("adherentId") Long adherentId,
                                      @Param("type") String type,
                                      @Param("from") LocalDate from,
                                      @Param("to") LocalDate to);
}
