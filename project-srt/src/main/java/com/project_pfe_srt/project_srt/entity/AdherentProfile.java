package com.project_pfe_srt.project_srt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "adherent_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdherentProfile {

    /** PK = same id as the linked User. */
    @Id
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "salaire")
    private Double salaire;

    @Column(name = "enfants")
    private Integer enfants;

    @Column(name = "marie")
    private Boolean marie;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;
}
