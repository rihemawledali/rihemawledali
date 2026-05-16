package com.project_pfe_srt.project_srt.treasurer.compte.service;

import com.project_pfe_srt.project_srt.shared.tresorerie.dto.DepotManuelRequest;
import com.project_pfe_srt.project_srt.shared.tresorerie.entity.CompteBancaire;
import com.project_pfe_srt.project_srt.shared.tresorerie.entity.HistoriqueTresorerie;
import com.project_pfe_srt.project_srt.shared.tresorerie.repository.CompteBancaireRepository;
import com.project_pfe_srt.project_srt.shared.tresorerie.service.TreasuryLedger;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompteBancaireServiceTest {

    @Mock
    private CompteBancaireRepository repo;

    @Mock
    private TreasuryLedger ledger;

    @InjectMocks
    private CompteBancaireService service;

    @Test
    void deposerManuellementCreatesEntryOnSelectedAccount() {
        CompteBancaire compte = CompteBancaire.builder()
                .id(3L)
                .banque("BIAT")
                .iban("TN59")
                .solde(100d)
                .devise("TND")
                .build();
        HistoriqueTresorerie history = HistoriqueTresorerie.builder()
                .id(9L)
                .type("entree")
                .typeOperation("VERSEMENT_MANUEL")
                .montant(250d)
                .utilisateur("Tresorier")
                .compteBancaire(compte)
                .build();
        when(ledger.applyEntree(eq(3L), eq(250d), eq("VERSEMENT_MANUEL"),
                isNull(), isNull(), eq("Depot espece"), anyString(), eq("Tresorier")))
                .thenReturn(history);

        var result = service.deposerManuellement(3L,
                DepotManuelRequest.builder().montant(250d).description("Depot espece").build(),
                "Tresorier");

        assertThat(result.getCompteBancaireId()).isEqualTo("3");
        assertThat(result.getType()).isEqualTo("entree");
        assertThat(result.getTypeOperation()).isEqualTo("VERSEMENT_MANUEL");
        assertThat(result.getMontant()).isEqualTo(250d);
        verify(ledger).applyEntree(eq(3L), eq(250d), eq("VERSEMENT_MANUEL"),
                isNull(), isNull(), eq("Depot espece"), anyString(), eq("Tresorier"));
    }
}
