package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.FactureDto;
import com.project_pfe_srt.project_srt.dto.FactureRequest;
import com.project_pfe_srt.project_srt.entity.Facture;
import com.project_pfe_srt.project_srt.entity.Fournisseur;
import com.project_pfe_srt.project_srt.repository.FactureRepository;
import com.project_pfe_srt.project_srt.repository.FournisseurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FactureService {

    static final Set<String> STATUTS = Set.of(
            "brouillon", "non_payee", "impayee", "partielle", "en_retard", "payee", "annulee");

    private final FactureRepository factureRepository;
    private final FournisseurRepository fournisseurRepository;

    public List<FactureDto> list() {
        return factureRepository.findAllByOrderByDateEmissionDesc()
                .stream().map(FactureDto::from).toList();
    }

    public FactureDto getById(Long id) {
        return factureRepository.findById(id)
                .map(FactureDto::from)
                .orElseThrow(() -> new IllegalArgumentException("Facture introuvable."));
    }

    private static String requireStatut(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        String v = value.trim().toLowerCase();
        if (!STATUTS.contains(v)) throw new IllegalArgumentException("Statut de facture invalide.");
        return v;
    }

    private static LocalDate parseDate(String value, String fieldLabel) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldLabel + " requise.");
        }
        try {
            // Accept either yyyy-MM-dd or full ISO datetime (we only keep the date part).
            return LocalDate.parse(value.length() > 10 ? value.substring(0, 10) : value);
        } catch (Exception e) {
            throw new IllegalArgumentException(fieldLabel + " invalide (format attendu : yyyy-MM-dd).");
        }
    }

    public FactureDto create(FactureRequest req) {
        if (req.getNumero() == null || req.getNumero().isBlank()) {
            throw new IllegalArgumentException("Le numéro est requis.");
        }
        if (factureRepository.existsByNumero(req.getNumero())) {
            throw new IllegalArgumentException("Numéro de facture déjà utilisé.");
        }
        if (req.getMontant() == null || req.getMontant() <= 0) {
            throw new IllegalArgumentException("Montant invalide.");
        }
        if (req.getFournisseurId() == null) {
            throw new IllegalArgumentException("Le fournisseur est requis.");
        }
        Fournisseur f = fournisseurRepository.findById(req.getFournisseurId())
                .orElseThrow(() -> new IllegalArgumentException("Fournisseur introuvable."));

        LocalDate emission = parseDate(req.getDateEmission(), "Date d'émission");
        LocalDate echeance = parseDate(req.getDateEcheance(), "Date d'échéance");
        if (echeance.isBefore(emission)) {
            throw new IllegalArgumentException("La date d'échéance doit être après la date d'émission.");
        }

        Facture facture = Facture.builder()
                .numero(req.getNumero().trim())
                .fournisseur(f)
                .montant(req.getMontant())
                .statut(requireStatut(req.getStatut(), "non_payee"))
                .dateEmission(emission)
                .dateEcheance(echeance)
                .description(req.getDescription())
                .build();
        return FactureDto.from(factureRepository.save(facture));
    }

    public FactureDto update(Long id, FactureRequest req) {
        Facture f = factureRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Facture introuvable."));

        if (req.getNumero() != null && !req.getNumero().equalsIgnoreCase(f.getNumero())) {
            if (factureRepository.existsByNumero(req.getNumero())) {
                throw new IllegalArgumentException("Numéro de facture déjà utilisé.");
            }
            f.setNumero(req.getNumero().trim());
        }
        if (req.getFournisseurId() != null) {
            Fournisseur four = fournisseurRepository.findById(req.getFournisseurId())
                    .orElseThrow(() -> new IllegalArgumentException("Fournisseur introuvable."));
            f.setFournisseur(four);
        }
        if (req.getMontant() != null) {
            if (req.getMontant() <= 0) throw new IllegalArgumentException("Montant invalide.");
            f.setMontant(req.getMontant());
        }
        if (req.getStatut() != null) f.setStatut(requireStatut(req.getStatut(), f.getStatut()));
        if (req.getDateEmission() != null) f.setDateEmission(parseDate(req.getDateEmission(), "Date d'émission"));
        if (req.getDateEcheance() != null) f.setDateEcheance(parseDate(req.getDateEcheance(), "Date d'échéance"));
        if (req.getDescription() != null) f.setDescription(req.getDescription());
        if (f.getDateEcheance().isBefore(f.getDateEmission())) {
            throw new IllegalArgumentException("La date d'échéance doit être après la date d'émission.");
        }

        return FactureDto.from(factureRepository.save(f));
    }

    public FactureDto annuler(Long id) {
        Facture f = factureRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Facture introuvable."));
        if ("payee".equalsIgnoreCase(f.getStatut())) {
            throw new IllegalArgumentException("Impossible d'annuler une facture déjà payée.");
        }
        f.setStatut("annulee");
        return FactureDto.from(factureRepository.save(f));
    }

    public void delete(Long id) {
        if (!factureRepository.existsById(id)) {
            throw new IllegalArgumentException("Facture introuvable.");
        }
        factureRepository.deleteById(id);
    }
}
