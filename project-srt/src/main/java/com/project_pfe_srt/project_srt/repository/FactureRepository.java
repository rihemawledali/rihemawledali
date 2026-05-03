package com.project_pfe_srt.project_srt.repository;

import com.project_pfe_srt.project_srt.entity.Facture;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FactureRepository extends JpaRepository<Facture, Long> {
    Optional<Facture> findByNumero(String numero);
    boolean existsByNumero(String numero);
    List<Facture> findAllByOrderByDateEmissionDesc();
    List<Facture> findByStatutOrderByDateEcheanceAsc(String statut);
    long countByStatut(String statut);
}
