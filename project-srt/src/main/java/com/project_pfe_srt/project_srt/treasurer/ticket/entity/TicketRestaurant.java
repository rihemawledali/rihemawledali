package com.project_pfe_srt.project_srt.treasurer.ticket.entity;

import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.treasurer.boncommande.entity.BonCommande;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketRestaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String numero;

    /** restaurant | cafeteria */
    @Column(name = "type_bon", nullable = false)
    private String typeBon;

    @Column(nullable = false)
    private Double montant;

    /** Number of tickets represented by this assignment row. */
    @Builder.Default
    @Column(nullable = false)
    private Integer quantite = 1;

    /** en_attente | attribue | utilise | expire */
    @Builder.Default
    @Column(nullable = false)
    private String statut = "attribue";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adherent_id")
    private User adherent;

    /** Parent stock order — nullable for legacy/standalone tickets. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bon_commande_id")
    private BonCommande bonCommande;

    @Column(name = "date_emission", nullable = false)
    private LocalDate dateEmission;

    /** Set when the treasurer assigns the ticket to an adhérent. */
    @Column(name = "date_attribution")
    private LocalDate dateAttribution;

    /** Groups tickets assigned together so the adherent decides on the quantity, not each ticket. */
    @Column(name = "assignment_batch_id", length = 64)
    private String assignmentBatchId;

    @Column(name = "date_decision")
    private LocalDate dateDecision;
}
