package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.CompteBancaireDto;
import com.project_pfe_srt.project_srt.dto.TreasurerStatsDto;
import com.project_pfe_srt.project_srt.entity.CompteBancaire;
import com.project_pfe_srt.project_srt.repository.*;
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
    private final AdhesionRepository adhesionRepo;
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
                .adhesionsEnAttente(adhesionRepo.countByStatut("en_attente"))
                .retenuesGenerees(retenueRepo.countByStatut("GENEREE"))
                .retenuesConfirmees(retenueRepo.countByStatut("EXPORTEE"))
                .comptes(comptes.stream().map(CompteBancaireDto::from).toList())
                .build();
    }
}
