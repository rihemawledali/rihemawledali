package com.project_pfe_srt.project_srt.repository;

import com.project_pfe_srt.project_srt.entity.CompteBancaire;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompteBancaireRepository extends JpaRepository<CompteBancaire, Long> {
    List<CompteBancaire> findAllByOrderByIdAsc();
}
