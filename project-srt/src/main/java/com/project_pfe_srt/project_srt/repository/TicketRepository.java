package com.project_pfe_srt.project_srt.repository;

import com.project_pfe_srt.project_srt.entity.TicketRestaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketRepository extends JpaRepository<TicketRestaurant, Long> {
    List<TicketRestaurant> findByAdherentIdOrderByDateEmissionDesc(Long adherentId);
    long countByAdherentIdAndStatut(Long adherentId, String statut);
    List<TicketRestaurant> findAllByOrderByDateEmissionDesc();
    boolean existsByNumero(String numero);
    long countByStatut(String statut);
}
