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

    List<TicketRestaurant> findByBonCommandeIdOrderByNumeroAsc(Long bonCommandeId);
    long countByBonCommandeId(Long bonCommandeId);
    long countByBonCommandeIdAndStatut(Long bonCommandeId, String statut);

    /** Used by the assignment routine to grab the next N unassigned tickets. */
    List<TicketRestaurant> findByBonCommandeIdAndStatutOrderByNumeroAsc(
            Long bonCommandeId, String statut, org.springframework.data.domain.Pageable pageable);

    List<TicketRestaurant> findByAdherentIdAndStatutOrderByDateDecisionDesc(Long adherentId, String statut);
}
