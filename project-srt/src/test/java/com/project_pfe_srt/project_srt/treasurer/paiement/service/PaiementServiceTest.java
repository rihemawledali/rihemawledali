package com.project_pfe_srt.project_srt.treasurer.paiement.service;

import com.project_pfe_srt.project_srt.adherent.indemnite.entity.Indemnite;
import com.project_pfe_srt.project_srt.adherent.indemnite.repository.IndemniteRepository;
import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.shared.tresorerie.entity.CompteBancaire;
import com.project_pfe_srt.project_srt.shared.tresorerie.service.TreasuryLedger;
import com.project_pfe_srt.project_srt.treasurer.facture.entity.Facture;
import com.project_pfe_srt.project_srt.treasurer.facture.repository.FactureRepository;
import com.project_pfe_srt.project_srt.treasurer.paiement.dto.PaiementRequest;
import com.project_pfe_srt.project_srt.treasurer.paiement.entity.Paiement;
import com.project_pfe_srt.project_srt.treasurer.paiement.repository.PaiementRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaiementServiceTest {

    @Mock
    private PaiementRepository paiementRepository;

    @Mock
    private FactureRepository factureRepository;

    @Mock
    private IndemniteRepository indemniteRepository;

    @Mock
    private TreasuryLedger ledger;

    @InjectMocks
    private PaiementService paiementService;

    @Test
    void payFactureUsesBackendFactureAmountAndSelectedBankAccount() {
        Facture facture = facture();
        when(factureRepository.findById(5L)).thenReturn(Optional.of(facture));
        when(paiementRepository.existsByReference("PAY-1")).thenReturn(false);
        when(ledger.resolveCompte(3L)).thenReturn(compte());
        when(paiementRepository.save(any(Paiement.class))).thenAnswer(invocation -> savedPaiement(invocation.getArgument(0)));

        paiementService.payFacture(5L, request(1d), "Tresorier");

        ArgumentCaptor<Paiement> saved = ArgumentCaptor.forClass(Paiement.class);
        verify(paiementRepository).save(saved.capture());
        assertThat(saved.getValue().getMontant()).isEqualTo(500d);
        assertThat(saved.getValue().getCompteBancaire().getId()).isEqualTo(3L);
        verify(ledger).applySortie(eq(3L), eq(500d), eq("PAIEMENT"), eq("FOURNISSEUR"),
                eq(100L), any(), eq("PAY-1"), eq("virement"), eq("reussi"), eq("Tresorier"));
        assertThat(facture.getStatut()).isEqualTo("payee");
    }

    @Test
    void payIndemniteUsesBackendIndemniteAmountAndSelectedBankAccount() {
        Indemnite indemnite = indemnite();
        when(indemniteRepository.findById(8L)).thenReturn(Optional.of(indemnite));
        when(paiementRepository.existsByReference("PAY-1")).thenReturn(false);
        when(ledger.resolveCompte(3L)).thenReturn(compte());
        when(paiementRepository.save(any(Paiement.class))).thenAnswer(invocation -> savedPaiement(invocation.getArgument(0)));

        paiementService.payIndemnite(8L, request(1d), "Tresorier");

        ArgumentCaptor<Paiement> saved = ArgumentCaptor.forClass(Paiement.class);
        verify(paiementRepository).save(saved.capture());
        assertThat(saved.getValue().getMontant()).isEqualTo(300d);
        assertThat(saved.getValue().getCompteBancaire().getId()).isEqualTo(3L);
        verify(ledger).applySortie(eq(3L), eq(300d), eq("PAIEMENT"), eq("INDEMNITE"),
                eq(100L), any(), eq("PAY-1"), eq("virement"), eq("reussi"), eq("Tresorier"));
        assertThat(indemnite.getStatut()).isEqualTo("payee");
    }

    @Test
    void payFactureRequiresBankAccountForSuccessfulPayment() {
        Facture facture = facture();
        PaiementRequest req = request(1d);
        req.setCompteBancaireId(null);

        when(factureRepository.findById(5L)).thenReturn(Optional.of(facture));
        when(paiementRepository.existsByReference("PAY-1")).thenReturn(false);

        assertThatThrownBy(() -> paiementService.payFacture(5L, req, "Tresorier"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Compte bancaire obligatoire.");
        verify(paiementRepository, never()).save(any(Paiement.class));
        assertThat(facture.getStatut()).isEqualTo("non_payee");
    }

    @Test
    void insufficientBalanceRejectsPaymentBeforeSourceIsMarkedPaid() {
        Facture facture = facture();
        when(factureRepository.findById(5L)).thenReturn(Optional.of(facture));
        when(paiementRepository.existsByReference("PAY-1")).thenReturn(false);
        when(ledger.resolveCompte(3L)).thenReturn(compte());
        when(paiementRepository.save(any(Paiement.class))).thenAnswer(invocation -> savedPaiement(invocation.getArgument(0)));
        when(ledger.applySortie(eq(3L), eq(500d), eq("PAIEMENT"), eq("FOURNISSEUR"),
                eq(100L), any(), eq("PAY-1"), eq("virement"), eq("reussi"), eq("Tresorier")))
                .thenThrow(new IllegalArgumentException("Solde insuffisant."));

        assertThatThrownBy(() -> paiementService.payFacture(5L, request(1d), "Tresorier"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Solde insuffisant.");
        assertThat(facture.getStatut()).isEqualTo("non_payee");
        verify(factureRepository, never()).save(any(Facture.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {"reussi", "echoue", "rembourse"})
    void validerRejectsNonPendingPayment(String statut) {
        Paiement paiement = pendingPaiement();
        paiement.setStatut(statut);
        when(paiementRepository.findById(1L)).thenReturn(Optional.of(paiement));

        assertThatThrownBy(() -> paiementService.valider(1L, "Tresorier"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Seul un paiement en attente");
        verify(ledger, never()).applySortie(any(), anyDouble(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void validerRejectsPendingPaymentWithoutBankAccount() {
        Paiement paiement = pendingPaiement();
        paiement.setCompteBancaire(null);
        when(paiementRepository.findById(1L)).thenReturn(Optional.of(paiement));

        assertThatThrownBy(() -> paiementService.valider(1L, "Tresorier"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Compte bancaire obligatoire.");
        verify(paiementRepository, never()).save(any(Paiement.class));
        verify(ledger, never()).applySortie(any(), anyDouble(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    private static PaiementRequest request(double montant) {
        return PaiementRequest.builder()
                .reference("PAY-1")
                .montant(montant)
                .mode("virement")
                .compteBancaireId(3L)
                .build();
    }

    private static Paiement savedPaiement(Paiement paiement) {
        if (paiement.getId() == null) {
            paiement.setId(100L);
        }
        return paiement;
    }

    private static Paiement pendingPaiement() {
        return Paiement.builder()
                .id(1L)
                .reference("PAY-1")
                .typePaiement("AUTRE_SORTIE")
                .beneficiaireType("AUTRE")
                .beneficiaire("Autre")
                .compteBancaire(compte())
                .montant(50d)
                .mode("virement")
                .statut("en_attente")
                .date(LocalDateTime.now())
                .build();
    }

    private static Facture facture() {
        return Facture.builder()
                .id(5L)
                .numero("FAC-1")
                .montant(500d)
                .statut("non_payee")
                .dateEmission(LocalDate.now())
                .dateEcheance(LocalDate.now().plusDays(30))
                .build();
    }

    private static Indemnite indemnite() {
        return Indemnite.builder()
                .id(8L)
                .adherent(adherent())
                .type("maladie")
                .montant(300d)
                .statut("approuvee")
                .dateDemande(LocalDate.now())
                .build();
    }

    private static CompteBancaire compte() {
        return CompteBancaire.builder()
                .id(3L)
                .banque("BIAT")
                .iban("TN59")
                .solde(1000d)
                .devise("TND")
                .build();
    }

    private static User adherent() {
        return User.builder()
                .id(1L)
                .nom("Ben Salah")
                .prenom("Ali")
                .email("ali@srt.test")
                .role(Role.ADHERENT)
                .statut("ACTIF")
                .build();
    }
}
