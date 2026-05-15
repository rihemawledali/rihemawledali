package com.project_pfe_srt.project_srt.treasurer.dashboard.service;

import com.project_pfe_srt.project_srt.adherent.indemnite.repository.IndemniteRepository;
import com.project_pfe_srt.project_srt.adherent.pret.repository.PretRepository;
import com.project_pfe_srt.project_srt.shared.tresorerie.dto.CompteBancaireDto;
import com.project_pfe_srt.project_srt.shared.tresorerie.entity.CompteBancaire;
import com.project_pfe_srt.project_srt.shared.tresorerie.repository.CompteBancaireRepository;
import com.project_pfe_srt.project_srt.treasurer.dashboard.dto.TreasurerStatsDto;
import com.project_pfe_srt.project_srt.treasurer.facture.repository.FactureRepository;
import com.project_pfe_srt.project_srt.treasurer.retenue.repository.RetenueMensuelleRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TreasurerDashboardService {

    private final CompteBancaireRepository compteRepo;
    private final FactureRepository factureRepo;
    private final IndemniteRepository indemniteRepo;
    private final PretRepository pretRepo;
    private final RetenueMensuelleRepository retenueRepo;

    public TreasurerStatsDto stats() {
        List<CompteBancaire> comptes = compteRepo.findAllByOrderByIdAsc();
        double total = comptes.stream().mapToDouble(c -> c.getSolde() == null ? 0d : c.getSolde()).sum();
        String devise = comptes.isEmpty() ? "TND" : comptes.get(0).getDevise();

        return TreasurerStatsDto.builder()
                .soldeTotal(total)
                .deviseAffichage(devise)
                .facturesNonPayees(factureRepo.countByStatut("non_payee") + factureRepo.countByStatut("impayee"))
                .facturesEnRetard(factureRepo.countByStatut("en_retard"))
                .indemnitesEnAttente(indemniteRepo.countByStatut("en_attente"))
                .indemnitesValidees(indemniteRepo.countByStatut("approuvee") + indemniteRepo.countByStatut("validee"))
                .pretsEnAttente(pretRepo.countByStatut("en_attente"))
                .retenuesGenerees(retenueRepo.countByStatut("GENEREE"))
                .retenuesConfirmees(retenueRepo.countByStatut("EXPORTEE"))
                .comptes(comptes.stream().map(CompteBancaireDto::from).toList())
                .build();
    }
}
