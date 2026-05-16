package com.project_pfe_srt.project_srt.shared.convention.repository;

import com.project_pfe_srt.project_srt.shared.convention.entity.Convention;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConventionRepository extends JpaRepository<Convention, Long> {
    boolean existsByFournisseurId(Long fournisseurId);
    List<Convention> findAllByOrderByDateDebutDescIdDesc();
}
