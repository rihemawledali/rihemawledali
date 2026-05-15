package com.project_pfe_srt.project_srt.treasurer.facture.service;

import com.project_pfe_srt.project_srt.common.exception.NotFoundException;
import com.project_pfe_srt.project_srt.common.util.DateParser;
import com.project_pfe_srt.project_srt.common.util.Repos;
import com.project_pfe_srt.project_srt.common.util.Validators;
import com.project_pfe_srt.project_srt.shared.fournisseur.entity.Fournisseur;
import com.project_pfe_srt.project_srt.shared.fournisseur.repository.FournisseurRepository;
import com.project_pfe_srt.project_srt.treasurer.facture.dto.FactureDto;
import com.project_pfe_srt.project_srt.treasurer.facture.dto.FactureRequest;
import com.project_pfe_srt.project_srt.treasurer.facture.entity.Facture;
import com.project_pfe_srt.project_srt.treasurer.facture.repository.FactureRepository;

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
        return FactureDto.from(findFacture(id));
    }

    public FactureDto create(FactureRequest req) {
        String numero = Validators.requireNonBlank(req.getNumero(), "Numéro");
        if (factureRepository.existsByNumero(numero)) {
            throw new IllegalArgumentException("Numéro de facture déjà utilisé.");
        }
        double montant = Validators.requirePositive(req.getMontant(), "Montant");
        if (req.getFournisseurId() == null) {
            throw new IllegalArgumentException("Le fournisseur est requis.");
        }
        Fournisseur fournisseur = Repos.findOrThrow(
                fournisseurRepository, req.getFournisseurId(), "Fournisseur");

        LocalDate emission = DateParser.parseIsoDate(req.getDateEmission(), "d'émission");
        LocalDate echeance = DateParser.parseIsoDate(req.getDateEcheance(), "d'échéance");
        if (echeance.isBefore(emission)) {
            throw new IllegalArgumentException("La date d'échéance doit être après la date d'émission.");
        }

        Facture facture = Facture.builder()
                .numero(numero)
                .fournisseur(fournisseur)
                .montant(montant)
                .statut(requireStatut(req.getStatut(), "non_payee"))
                .dateEmission(emission)
                .dateEcheance(echeance)
                .description(req.getDescription())
                .build();
        return FactureDto.from(factureRepository.save(facture));
    }

    public FactureDto update(Long id, FactureRequest req) {
        Facture f = findFacture(id);

        if (req.getNumero() != null && !req.getNumero().equalsIgnoreCase(f.getNumero())) {
            if (factureRepository.existsByNumero(req.getNumero())) {
                throw new IllegalArgumentException("Numéro de facture déjà utilisé.");
            }
            f.setNumero(req.getNumero().trim());
        }
        if (req.getFournisseurId() != null) {
            f.setFournisseur(Repos.findOrThrow(
                    fournisseurRepository, req.getFournisseurId(), "Fournisseur"));
        }
        if (req.getMontant() != null) {
            f.setMontant(Validators.requirePositive(req.getMontant(), "Montant"));
        }
        if (req.getStatut() != null) f.setStatut(requireStatut(req.getStatut(), f.getStatut()));
        if (req.getDateEmission() != null) f.setDateEmission(DateParser.parseIsoDate(req.getDateEmission(), "d'émission"));
        if (req.getDateEcheance() != null) f.setDateEcheance(DateParser.parseIsoDate(req.getDateEcheance(), "d'échéance"));
        if (req.getDescription() != null) f.setDescription(req.getDescription());
        if (f.getDateEcheance().isBefore(f.getDateEmission())) {
            throw new IllegalArgumentException("La date d'échéance doit être après la date d'émission.");
        }

        return FactureDto.from(factureRepository.save(f));
    }

    public FactureDto annuler(Long id) {
        Facture f = findFacture(id);
        if ("payee".equalsIgnoreCase(f.getStatut())) {
            throw new IllegalArgumentException("Impossible d'annuler une facture déjà payée.");
        }
        f.setStatut("annulee");
        return FactureDto.from(factureRepository.save(f));
    }

    public void delete(Long id) {
        if (!factureRepository.existsById(id)) {
            throw NotFoundException.of("Facture");
        }
        factureRepository.deleteById(id);
    }

    // ---- helpers --------------------------------------------------------

    private Facture findFacture(Long id) {
        return Repos.findOrThrow(factureRepository, id, "Facture");
    }

    private static String requireStatut(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        return Validators.requireOneOfLower(STATUTS, value, "Statut de facture");
    }
}
