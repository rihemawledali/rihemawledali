package com.project_pfe_srt.project_srt.treasurer.ai.service;

import com.project_pfe_srt.project_srt.adherent.pret.entity.PretSocial;
import com.project_pfe_srt.project_srt.adherent.pret.repository.PretRepository;
import com.project_pfe_srt.project_srt.adherent.pret.service.PretService;
import com.project_pfe_srt.project_srt.adherent.profile.repository.AdherentProfileRepository;
import com.project_pfe_srt.project_srt.auth.entity.User;
import com.project_pfe_srt.project_srt.common.exception.ApiException;
import com.project_pfe_srt.project_srt.common.util.Money;
import com.project_pfe_srt.project_srt.common.util.Repos;
import com.project_pfe_srt.project_srt.treasurer.ai.dto.PretAiAnswerDto;
import com.project_pfe_srt.project_srt.treasurer.ai.dto.PretAiAskRequest;
import com.project_pfe_srt.project_srt.treasurer.retenue.entity.RetenueLigne;
import com.project_pfe_srt.project_srt.treasurer.retenue.repository.RetenueLigneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PretAiAssistantService {

    private static final String TYPE_PRET = "PRET";
    private static final String STATUT_PRELEVEE = "PRELEVEE";
    private static final String STATUT_ANNULEE = "ANNULEE";
    private static final String DEFAULT_QUESTION = """
            Explique clairement la situation de ce pret pour le tresorier :
            statut, montant rembourse, montant restant, mois payes, mois manquants
            et incoherences eventuelles.
            """;

    private final PretRepository pretRepository;
    private final RetenueLigneRepository retenueLigneRepository;
    private final AdherentProfileRepository adherentProfileRepository;
    private final OpenAiPretAssistantClient aiClient;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public PretAiAnswerDto ask(Long pretId, PretAiAskRequest request) {
        PretSocial pret = Repos.findOrThrow(pretRepository, pretId, "Pret");
        List<RetenueLigne> remboursements = retenueLigneRepository
                .findByTypeAndSourceRefIdInOrderByRetenuePeriod(TYPE_PRET, List.of(pretId));

        String question = request == null || request.getQuestion() == null || request.getQuestion().isBlank()
                ? DEFAULT_QUESTION
                : request.getQuestion().trim();

        String contextJson = toJson(buildContext(pret, remboursements));
        String answer = aiClient.ask(systemPrompt(), userPrompt(question, contextJson));
        return PretAiAnswerDto.builder().answer(answer).build();
    }

    private Map<String, Object> buildContext(PretSocial pret, List<RetenueLigne> remboursements) {
        double monthlyPayment = canCalculateMonthlyPayment(pret)
                ? Money.round2(PretService.calculateMonthlyPayment(pret.getMontant(), pret.getDuree(), pret.getTaux()))
                : 0d;
        int paidInstallments = 0;
        double totalReimbursed = 0d;
        List<Map<String, Object>> paidMonths = new ArrayList<>();
        List<Map<String, Object>> unpaidMonths = new ArrayList<>();
        List<Map<String, Object>> allLines = new ArrayList<>();

        for (RetenueLigne ligne : remboursements) {
            Map<String, Object> row = lineContext(ligne);
            allLines.add(row);
            if (STATUT_PRELEVEE.equalsIgnoreCase(ligne.getStatut())) {
                paidInstallments++;
                totalReimbursed += Money.orZero(ligne.getMontant());
                paidMonths.add(row);
            } else if (!STATUT_ANNULEE.equalsIgnoreCase(ligne.getStatut())) {
                unpaidMonths.add(row);
            }
        }

        totalReimbursed = Money.round2(totalReimbursed);
        double expectedTotalToPay = pret.getDuree() == null ? 0d : Money.round2(monthlyPayment * pret.getDuree());
        double remainingAmount = expectedTotalToPay <= 0d
                ? 0d
                : Math.max(0d, Money.round2(expectedTotalToPay - totalReimbursed));

        Map<String, Object> context = new LinkedHashMap<>();
        context.put("today", LocalDate.now().toString());
        context.put("pret", pretContext(pret, monthlyPayment, expectedTotalToPay));
        context.put("adherent", adherentContext(pret.getAdherent()));
        context.put("remboursementSummary", Map.of(
                "generatedRetenueLines", remboursements.size(),
                "paidInstallments", paidInstallments,
                "unpaidGeneratedInstallments", unpaidMonths.size(),
                "totalReimbursed", totalReimbursed,
                "remainingAmount", remainingAmount
        ));
        context.put("paidMonths", paidMonths);
        context.put("unpaidMonths", unpaidMonths);
        context.put("missingMonths", missingMonths(pret, remboursements));
        context.put("allRetenueLines", allLines);
        context.put("detectedDataIssues", detectedDataIssues(pret, remboursements, paidInstallments, expectedTotalToPay, totalReimbursed));
        return context;
    }

    private Map<String, Object> pretContext(PretSocial pret, double monthlyPayment, double expectedTotalToPay) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", pret.getId());
        data.put("montant", pret.getMontant());
        data.put("dureeMois", pret.getDuree());
        data.put("tauxAnnuelPourcent", pret.getTaux());
        data.put("retenueMensuelleCalculee", monthlyPayment);
        data.put("totalAttenduAvecInterets", expectedTotalToPay);
        data.put("statut", pret.getStatut());
        data.put("dateDemande", pret.getDateDemande());
        data.put("dateAccord", pret.getDateAccord());
        data.put("motifFourni", pret.getMotif() != null && !pret.getMotif().isBlank());
        data.put("justificatifFourni", pret.getAttachment() != null);
        return data;
    }

    private Map<String, Object> adherentContext(User adherent) {
        Map<String, Object> data = new LinkedHashMap<>();
        if (adherent == null) {
            data.put("missing", true);
            return data;
        }
        data.put("id", adherent.getId());
        data.put("nomComplet", fullName(adherent));
        data.put("matricule", adherent.getMatricule());
        data.put("statutCompte", adherent.getStatut());
        data.put("profilAdherentDisponible", adherentProfileRepository.existsById(adherent.getId()));
        return data;
    }

    private Map<String, Object> lineContext(RetenueLigne ligne) {
        Map<String, Object> data = new LinkedHashMap<>();
        var retenue = ligne.getRetenue();
        data.put("ligneId", ligne.getId());
        data.put("retenueId", retenue == null ? null : retenue.getId());
        data.put("mois", retenue == null ? null : retenue.getMois());
        data.put("annee", retenue == null ? null : retenue.getAnnee());
        data.put("periode", retenue == null || retenue.getMois() == null || retenue.getAnnee() == null
                ? null
                : YearMonth.of(retenue.getAnnee(), retenue.getMois()).toString());
        data.put("montant", ligne.getMontant());
        data.put("statut", ligne.getStatut());
        data.put("libelle", ligne.getLibelle());
        data.put("statutRetenueMensuelle", retenue == null ? null : retenue.getStatut());
        return data;
    }

    private List<String> missingMonths(PretSocial pret, List<RetenueLigne> remboursements) {
        if (pret.getDateAccord() == null || pret.getDuree() == null || pret.getDuree() <= 0) {
            return List.of("Impossible a determiner: dateAccord ou duree manquante.");
        }

        List<String> generatedPeriods = remboursements.stream()
                .map(ligne -> ligne.getRetenue() == null
                        || ligne.getRetenue().getMois() == null
                        || ligne.getRetenue().getAnnee() == null
                                ? null
                                : YearMonth.of(ligne.getRetenue().getAnnee(), ligne.getRetenue().getMois()).toString())
                .filter(period -> period != null && !period.isBlank())
                .toList();

        YearMonth first = YearMonth.from(pret.getDateAccord());
        YearMonth current = YearMonth.now();
        List<String> missing = new ArrayList<>();
        for (int i = 0; i < pret.getDuree(); i++) {
            YearMonth expected = first.plusMonths(i);
            if (expected.isAfter(current)) {
                break;
            }
            String period = expected.toString();
            if (!generatedPeriods.contains(period)) {
                missing.add(period);
            }
        }
        return missing;
    }

    private List<String> detectedDataIssues(
            PretSocial pret,
            List<RetenueLigne> remboursements,
            int paidInstallments,
            double expectedTotalToPay,
            double totalReimbursed
    ) {
        List<String> issues = new ArrayList<>();
        if (pret.getAdherent() == null) issues.add("Adherent lie au pret manquant.");
        if (pret.getMontant() == null || pret.getMontant() <= 0) issues.add("Montant du pret manquant ou invalide.");
        if (pret.getDuree() == null || pret.getDuree() <= 0) issues.add("Duree du pret manquante ou invalide.");
        if (pret.getTaux() == null || pret.getTaux() < 0) issues.add("Taux du pret manquant ou invalide.");
        if (pret.getDateDemande() == null) issues.add("Date de demande manquante.");
        if (isRunningOrReimbursed(pret) && pret.getDateAccord() == null) {
            issues.add("Date d'accord manquante pour un pret en cours/rembourse.");
        }
        if ("rembourse".equalsIgnoreCase(pret.getStatut()) && pret.getDuree() != null && paidInstallments < pret.getDuree()) {
            issues.add("Statut rembourse mais nombre de mensualites prelevees inferieur a la duree.");
        }
        if (expectedTotalToPay > 0d && totalReimbursed > expectedTotalToPay) {
            issues.add("Total rembourse superieur au total attendu.");
        }
        if (remboursements.isEmpty() && isRunningOrReimbursed(pret)) {
            issues.add("Aucune ligne de retenue PRET trouvee pour un pret en cours/rembourse.");
        }
        return issues;
    }

    private String toJson(Map<String, Object> context) {
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(context);
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Contexte AI invalide.");
        }
    }

    private String userPrompt(String question, String contextJson) {
        return """
                Question du tresorier:
                %s

                Contexte backend minimal du pret:
                %s
                """.formatted(question, contextJson);
    }

    private String systemPrompt() {
        return """
                Tu es un assistant financier interne pour un tresorier SRT.
                Analyse uniquement le contexte fourni par le backend.
                Tu es strictement en lecture seule: ne propose aucune action qui modifie, valide,
                supprime, rembourse, change un statut, ou affecte un solde bancaire.
                Si la question demande une modification, refuse poliment et reste sur l'analyse.
                Ne devine jamais les donnees manquantes. Si une donnee manque, dis clairement
                qu'elle manque. Reponds en francais, de maniere courte et utile, avec les montants
                en TND et les mois au format AAAA-MM quand ils sont disponibles.
                """;
    }

    private static boolean canCalculateMonthlyPayment(PretSocial pret) {
        return pret.getMontant() != null
                && pret.getDuree() != null
                && pret.getDuree() > 0
                && pret.getTaux() != null;
    }

    private static boolean isRunningOrReimbursed(PretSocial pret) {
        return pret.getStatut() != null
                && List.of("en_cours", "en_retard", "rembourse").contains(pret.getStatut().toLowerCase());
    }

    private static String fullName(User user) {
        return ((user.getPrenom() == null ? "" : user.getPrenom() + " ")
                + (user.getNom() == null ? "" : user.getNom())).trim();
    }
}
