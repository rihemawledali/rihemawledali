package com.project_pfe_srt.project_srt.treasurer.boncommande.repository;

import com.project_pfe_srt.project_srt.treasurer.boncommande.entity.BonCommande;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BonCommandeRepository extends JpaRepository<BonCommande, Long> {
    Optional<BonCommande> findByNumero(String numero);
    boolean existsByNumero(String numero);
    List<BonCommande> findAllByOrderByDateEmissionDesc();
    long countByStatut(String statut);
}
