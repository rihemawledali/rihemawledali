package com.project_pfe_srt.project_srt.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "comptes_bancaires")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompteBancaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String banque;

    @Column(nullable = false, unique = true)
    private String iban;

    @Builder.Default
    @Column(nullable = false)
    private Double solde = 0.0;

    /** TND | EUR | USD */
    @Builder.Default
    @Column(nullable = false)
    private String devise = "TND";
}
