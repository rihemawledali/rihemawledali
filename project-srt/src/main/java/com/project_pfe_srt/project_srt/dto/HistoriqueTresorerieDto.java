package com.project_pfe_srt.project_srt.dto;

import com.project_pfe_srt.project_srt.entity.HistoriqueTresorerie;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueTresorerieDto {
    private String id;
    private String type;          // entree | sortie
    private String sourceType;    // FACTURE | INDEMNITE | RETENUE | AUTRE
    private String sourceRefId;
    private String description;
    private Double montant;
    private String date;
    private String reference;
    private String modePaiement;
    private String statut;
    private String utilisateur;

    public static HistoriqueTresorerieDto from(HistoriqueTresorerie h) {
        if (h == null) return null;
        return HistoriqueTresorerieDto.builder()
                .id(h.getId().toString())
                .type(h.getType())
                .sourceType(h.getSourceType())
                .sourceRefId(h.getSourceRefId() == null ? null : h.getSourceRefId().toString())
                .description(h.getDescription())
                .montant(h.getMontant())
                .date(h.getDate() == null ? null : h.getDate().toString())
                .reference(h.getReference())
                .modePaiement(h.getModePaiement())
                .statut(h.getStatut())
                .utilisateur(h.getUtilisateur())
                .build();
    }
}
