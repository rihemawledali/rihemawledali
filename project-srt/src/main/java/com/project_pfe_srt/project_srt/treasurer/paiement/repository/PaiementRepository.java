package com.project_pfe_srt.project_srt.treasurer.paiement.repository;

import com.project_pfe_srt.project_srt.treasurer.paiement.entity.Paiement;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaiementRepository extends JpaRepository<Paiement, Long> {
    Optional<Paiement> findByReference(String reference);
    boolean existsByReference(String reference);
    List<Paiement> findAllByOrderByDateDesc();
    long countByStatut(String statut);
    long countByTypePaiement(String typePaiement);
}
