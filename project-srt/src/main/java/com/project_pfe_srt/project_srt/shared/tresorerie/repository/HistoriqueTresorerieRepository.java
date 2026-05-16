package com.project_pfe_srt.project_srt.shared.tresorerie.repository;

import com.project_pfe_srt.project_srt.shared.tresorerie.entity.HistoriqueTresorerie;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface HistoriqueTresorerieRepository extends JpaRepository<HistoriqueTresorerie, Long> {

    List<HistoriqueTresorerie> findAllByOrderByDateDesc();

    List<HistoriqueTresorerie> findByReferenceOrderByDateDesc(String reference);

    @Query("""
           SELECT COALESCE(SUM(h.montant), 0)
           FROM HistoriqueTresorerie h
           WHERE LOWER(h.type) = LOWER(:type)
           """)
    double sumMontantByType(@Param("type") String type);

    @Query("""
           SELECT h FROM HistoriqueTresorerie h
           WHERE (:type IS NULL OR h.type = :type)
             AND (:sourceType IS NULL OR h.sourceType = :sourceType)
             AND (:from IS NULL OR h.date >= :from)
             AND (:to IS NULL OR h.date <= :to)
           ORDER BY h.date DESC
           """)
    List<HistoriqueTresorerie> search(@Param("type") String type,
                                      @Param("sourceType") String sourceType,
                                      @Param("from") LocalDateTime from,
                                      @Param("to") LocalDateTime to);
}
