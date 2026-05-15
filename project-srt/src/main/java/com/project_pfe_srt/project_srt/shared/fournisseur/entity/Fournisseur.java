package com.project_pfe_srt.project_srt.shared.fournisseur.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "fournisseurs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fournisseur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(length = 500)
    private String adresse;

    private String telephone;

    private String email;

    /** Lowercase: sante | restauration | transport | loisir | commerce | education */
    @Column(nullable = false)
    private String categorie;

    /** Lowercase: actif | inactif */
    @Builder.Default
    @Column(nullable = false)
    private String status = "actif";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
