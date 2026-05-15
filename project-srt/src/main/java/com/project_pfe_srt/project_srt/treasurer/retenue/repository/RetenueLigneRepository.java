package com.project_pfe_srt.project_srt.treasurer.retenue.repository;

import com.project_pfe_srt.project_srt.treasurer.retenue.entity.RetenueLigne;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface RetenueLigneRepository extends JpaRepository<RetenueLigne, Long> {

    List<RetenueLigne> findByRetenueIdOrderByIdAsc(Long retenueId);

    long countByTypeAndSourceRefId(String type, Long sourceRefId);

    long countByTypeAndSourceRefIdAndStatut(String type, Long sourceRefId, String statut);

    @Query("""
            select l
            from RetenueLigne l
            join fetch l.retenue r
            where l.type = :type
              and l.sourceRefId in :sourceRefIds
            order by r.annee asc, r.mois asc, l.id asc
            """)
    List<RetenueLigne> findByTypeAndSourceRefIdInOrderByRetenuePeriod(
            @Param("type") String type,
            @Param("sourceRefIds") Collection<Long> sourceRefIds);

    long deleteByRetenueId(Long retenueId);
}
