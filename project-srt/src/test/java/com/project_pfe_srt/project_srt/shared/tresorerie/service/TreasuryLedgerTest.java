package com.project_pfe_srt.project_srt.shared.tresorerie.service;

import com.project_pfe_srt.project_srt.shared.tresorerie.entity.CompteBancaire;
import com.project_pfe_srt.project_srt.shared.tresorerie.entity.HistoriqueTresorerie;
import com.project_pfe_srt.project_srt.shared.tresorerie.repository.CompteBancaireRepository;
import com.project_pfe_srt.project_srt.shared.tresorerie.repository.HistoriqueTresorerieRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TreasuryLedgerTest {

    @Mock
    private CompteBancaireRepository compteRepository;

    @Mock
    private HistoriqueTresorerieRepository historiqueRepository;

    @InjectMocks
    private TreasuryLedger ledger;

    @Test
    void applyEntreeIncreasesSelectedAccountAndCreatesHistory() {
        CompteBancaire compte = compte(100d);
        when(compteRepository.findById(3L)).thenReturn(Optional.of(compte));
        when(historiqueRepository.save(any(HistoriqueTresorerie.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ledger.applyEntree(3L, 250d, "VERSEMENT_MANUEL", null, null,
                "Depot", "DEP-1", "Tresorier");

        assertThat(compte.getSolde()).isEqualTo(350d);
        ArgumentCaptor<HistoriqueTresorerie> history = ArgumentCaptor.forClass(HistoriqueTresorerie.class);
        verify(historiqueRepository).save(history.capture());
        assertThat(history.getValue().getCompteBancaire()).isSameAs(compte);
        assertThat(history.getValue().getType()).isEqualTo("entree");
        assertThat(history.getValue().getTypeOperation()).isEqualTo("VERSEMENT_MANUEL");
        assertThat(history.getValue().getMontant()).isEqualTo(250d);
        assertThat(history.getValue().getUtilisateur()).isEqualTo("Tresorier");
    }

    @Test
    void applySortieDecreasesSelectedAccountAndCreatesHistory() {
        CompteBancaire compte = compte(1000d);
        when(compteRepository.findById(3L)).thenReturn(Optional.of(compte));
        when(historiqueRepository.save(any(HistoriqueTresorerie.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ledger.applySortie(3L, 400d, "PAIEMENT", "FOURNISSEUR", 10L,
                "Paiement facture", "PAY-1", "virement", "reussi", "Tresorier");

        assertThat(compte.getSolde()).isEqualTo(600d);
        ArgumentCaptor<HistoriqueTresorerie> history = ArgumentCaptor.forClass(HistoriqueTresorerie.class);
        verify(historiqueRepository).save(history.capture());
        assertThat(history.getValue().getCompteBancaire()).isSameAs(compte);
        assertThat(history.getValue().getType()).isEqualTo("sortie");
        assertThat(history.getValue().getTypeOperation()).isEqualTo("PAIEMENT");
        assertThat(history.getValue().getSourceType()).isEqualTo("FOURNISSEUR");
        assertThat(history.getValue().getSourceRefId()).isEqualTo(10L);
        assertThat(history.getValue().getMontant()).isEqualTo(-400d);
    }

    @Test
    void applySortieRejectsInsufficientBalanceBeforeSaving() {
        CompteBancaire compte = compte(100d);
        when(compteRepository.findById(3L)).thenReturn(Optional.of(compte));

        assertThatThrownBy(() -> ledger.applySortie(3L, 400d, "PAIEMENT", "FOURNISSEUR",
                10L, "Paiement facture", "PAY-1", "virement", "reussi", "Tresorier"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Solde insuffisant");

        assertThat(compte.getSolde()).isEqualTo(100d);
        verify(compteRepository, never()).save(any(CompteBancaire.class));
        verify(historiqueRepository, never()).save(any(HistoriqueTresorerie.class));
    }

    @Test
    void moneyMovementRequiresBankAccount() {
        assertThatThrownBy(() -> ledger.applyEntree(null, 100d, "VERSEMENT_MANUEL",
                null, null, "Depot", "DEP-1", "Tresorier"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Compte bancaire obligatoire.");
    }

    private static CompteBancaire compte(double solde) {
        return CompteBancaire.builder()
                .id(3L)
                .banque("BIAT")
                .iban("TN59")
                .solde(solde)
                .devise("TND")
                .build();
    }
}
