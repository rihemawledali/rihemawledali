package com.project_pfe_srt.project_srt.admin.dashboard.service;

import com.project_pfe_srt.project_srt.adherent.adhesion.repository.AdhesionRepository;
import com.project_pfe_srt.project_srt.adherent.indemnite.repository.IndemniteRepository;
import com.project_pfe_srt.project_srt.adherent.pret.repository.PretRepository;
import com.project_pfe_srt.project_srt.admin.dashboard.dto.AdminDashboardStatsDto;
import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;
import com.project_pfe_srt.project_srt.shared.fournisseur.repository.FournisseurRepository;
import com.project_pfe_srt.project_srt.shared.tresorerie.repository.HistoriqueTresorerieRepository;
import com.project_pfe_srt.project_srt.treasurer.boncommande.repository.BonCommandeRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final PretRepository pretRepository;
    private final IndemniteRepository indemniteRepository;
    private final AdhesionRepository adhesionRepository;
    private final BonCommandeRepository bonCommandeRepository;
    private final FournisseurRepository fournisseurRepository;
    private final HistoriqueTresorerieRepository historiqueTresorerieRepository;

    @Transactional(readOnly = true)
    public AdminDashboardStatsDto stats() {
        long demandesEnAttente =
                pretRepository.countByStatut("en_attente")
                        + indemniteRepository.countByStatut("en_attente")
                        + adhesionRepository.countByStatut("en_attente")
                        + bonCommandeRepository.countByStatut("en_attente");

        return AdminDashboardStatsDto.builder()
                .totalAdherents(userRepository.countByRole(Role.ADHERENT))
                .pretsActifs(pretRepository.countByStatut("en_cours"))
                .revenuTotal(totalEntrees())
                .demandesEnAttente(demandesEnAttente)
                .fournisseursActifs(fournisseurRepository.countByStatus("actif"))
                .trendAdherents(0d)
                .trendRevenu(0d)
                .trendPrets(0d)
                .trendDemandes(0d)
                .build();
    }

    private double totalEntrees() {
        return historiqueTresorerieRepository.sumMontantByType("entree");
    }
}
