package com.project_pfe_srt.project_srt.shared.tresorerie.repository;

import com.project_pfe_srt.project_srt.shared.tresorerie.entity.CompteBancaire;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompteBancaireRepository extends JpaRepository<CompteBancaire, Long> {
    List<CompteBancaire> findAllByOrderByIdAsc();
}
