package com.project_pfe_srt.project_srt.shared.fournisseur.repository;

import com.project_pfe_srt.project_srt.shared.fournisseur.entity.Fournisseur;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FournisseurRepository extends JpaRepository<Fournisseur, Long> {
    long countByStatus(String status);
    List<Fournisseur> findAllByOrderByNomAsc();
}
