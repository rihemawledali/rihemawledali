package com.project_pfe_srt.project_srt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "historique")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueFinanciere {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "adherent_id", nullable = false)
    private User adherent;

    /** credit | debit | pret | remboursement | cotisation | indemnite | facture */
    @Column(nullable = false)
    private String type;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Double montant;

    @Column(nullable = false)
    private LocalDate date;

    @Column(length = 100)
    private String reference;
}
