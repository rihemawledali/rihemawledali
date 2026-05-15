package com.project_pfe_srt.project_srt.treasurer.retenue.entity;

import com.project_pfe_srt.project_srt.auth.entity.User;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Master row: one per (adhérent × mois × année).
 *
 * Workflow:
 *   GENEREE → EXPORTEE
 *
 * Export is a pure document-generation step (CSV produced by the
 * backend) — no treasury ledger impact. Reverting to GENEREE just
 * resets the statut and clears `dateExport`.
 */
@Entity
@Table(
        name = "retenues_mensuelles",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_retenue_adherent_mois_annee",
                columnNames = {"adherent_id", "mois", "annee"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RetenueMensuelle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "adherent_id", nullable = false)
    private User adherent;

    /** 1..12 */
    @Column(nullable = false)
    private Integer mois;

    @Column(nullable = false)
    private Integer annee;

    @Builder.Default
    @Column(name = "total_retenu", nullable = false)
    private Double totalRetenu = 0.0;

    /** GENEREE | EXPORTEE */
    @Builder.Default
    @Column(nullable = false)
    private String statut = "GENEREE";

    /** Set when the master is first exported to CSV; cleared on rollback. */
    @Column(name = "date_export")
    private LocalDateTime dateExport;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
