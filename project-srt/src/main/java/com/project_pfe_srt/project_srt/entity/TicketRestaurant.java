package com.project_pfe_srt.project_srt.entity;

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

    /** en_attente | attribue | utilise | expire */
    @Builder.Default
    @Column(nullable = false)
    private String statut = "attribue";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adherent_id")
    private User adherent;

    @Column(name = "date_emission", nullable = false)
    private LocalDate dateEmission;
}
