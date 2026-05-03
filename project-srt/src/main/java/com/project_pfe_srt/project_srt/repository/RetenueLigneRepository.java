package com.project_pfe_srt.project_srt.repository;

import com.project_pfe_srt.project_srt.entity.RetenueLigne;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RetenueLigneRepository extends JpaRepository<RetenueLigne, Long> {

    List<RetenueLigne> findByRetenueIdOrderByIdAsc(Long retenueId);

    long deleteByRetenueId(Long retenueId);
}
