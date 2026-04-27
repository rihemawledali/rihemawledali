package com.project_pfe_srt.project_srt.repository;

import com.project_pfe_srt.project_srt.entity.Convention;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConventionRepository extends JpaRepository<Convention, Long> {
    boolean existsByFournisseurId(Long fournisseurId);
}
