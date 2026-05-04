package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.BonCommandeDetailDto;
import com.project_pfe_srt.project_srt.dto.BonCommandeDto;
import com.project_pfe_srt.project_srt.dto.BonCommandeRequest;
import com.project_pfe_srt.project_srt.dto.TicketDto;
import com.project_pfe_srt.project_srt.entity.BonCommande;
import com.project_pfe_srt.project_srt.entity.Fournisseur;
import com.project_pfe_srt.project_srt.entity.Role;
import com.project_pfe_srt.project_srt.entity.TicketRestaurant;
import com.project_pfe_srt.project_srt.entity.User;
import com.project_pfe_srt.project_srt.repository.BonCommandeRepository;
import com.project_pfe_srt.project_srt.repository.FournisseurRepository;
import com.project_pfe_srt.project_srt.repository.TicketRepository;
import com.project_pfe_srt.project_srt.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BonCommandeService {

    private static final Set<String> STATUTS = Set.of(
            // legacy
            "en_attente", "attribue", "utilise",
            // new
            "brouillon", "valide", "epuise", "expire");

    private static final Set<String> TYPES = Set.of("restaurant", "cafeteria");

    private final BonCommandeRepository repo;
    private final FournisseurRepository fournisseurRepository;
    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;

    public List<BonCommandeDto> list() {
        return repo.findAllByOrderByDateEmissionDesc().stream()
                .map(BonCommandeDto::from).toList();
    }

    public BonCommandeDetailDto getById(Long id) {
        BonCommande b = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bon de commande introuvable."));
        List<TicketDto> tickets = ticketRepository
                .findByBonCommandeIdOrderByNumeroAsc(b.getId()).stream()
                .map(TicketDto::from).toList();
        return BonCommandeDetailDto.builder()
                .bon(BonCommandeDto.from(b))
                .tickets(tickets)
                .build();
    }

    private static String requireStatut(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        String v = value.trim().toLowerCase();
        if (!STATUTS.contains(v)) throw new IllegalArgumentException("Statut invalide.");
        return v;
    }

    private static String requireType(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        String v = value.trim().toLowerCase();
        if (!TYPES.contains(v)) throw new IllegalArgumentException("Type de bon invalide (restaurant | cafeteria).");
        return v;
    }

    private static LocalDate parseDate(String v, String label) {
        if (v == null || v.isBlank()) throw new IllegalArgumentException(label + " requise.");
        try {
            return LocalDate.parse(v.length() > 10 ? v.substring(0, 10) : v);
        } catch (Exception e) {
            throw new IllegalArgumentException(label + " invalide.");
        }
    }

    /**
     * Creates a stock-level bon de commande and pre-generates all its
     * tickets (statut = en_attente, unassigned). The bon itself starts
     * in « brouillon » — use {@link #valider(Long)} to allow assignment.
     */
    @Transactional
    public BonCommandeDto create(BonCommandeRequest req) {
        if (req.getNumero() == null || req.getNumero().isBlank())
            throw new IllegalArgumentException("Numéro requis.");
        if (repo.existsByNumero(req.getNumero()))
            throw new IllegalArgumentException("Numéro déjà utilisé.");
        if (req.getMontant() == null || req.getMontant() <= 0)
            throw new IllegalArgumentException("Montant total invalide.");
        if (req.getValeurUnitaire() == null || req.getValeurUnitaire() <= 0)
            throw new IllegalArgumentException("Valeur unitaire d'un ticket invalide.");
        if (req.getFournisseurId() == null)
            throw new IllegalArgumentException("Fournisseur requis.");

        // Derive the number of tickets from the two monetary inputs when
        // omitted. Also sanity-check the ratio so the caller cannot
        // accidentally mix inconsistent values (e.g. 1000 DT / 7 DT = 142,85 → refused).
        int quantite;
        if (req.getQuantiteTotale() != null && req.getQuantiteTotale() > 0) {
            quantite = req.getQuantiteTotale();
        } else {
            double raw = req.getMontant() / req.getValeurUnitaire();
            if (Math.abs(raw - Math.round(raw)) > 1e-6) {
                throw new IllegalArgumentException(
                        "Le montant total doit être un multiple exact de la valeur unitaire.");
            }
            quantite = (int) Math.round(raw);
        }
        if (quantite <= 0 || quantite > 10_000) {
            throw new IllegalArgumentException("Quantité de tickets hors plage (1..10000).");
        }

        Fournisseur f = fournisseurRepository.findById(req.getFournisseurId())
                .orElseThrow(() -> new IllegalArgumentException("Fournisseur introuvable."));

        User adherent = null;
        if (req.getAdherentId() != null) {
            adherent = userRepository.findById(req.getAdherentId())
                    .orElseThrow(() -> new IllegalArgumentException("Adhérent introuvable."));
            if (adherent.getRole() != Role.ADHERENT) {
                throw new IllegalArgumentException("L'utilisateur sélectionné n'est pas un adhérent.");
            }
        }

        LocalDate emission = parseDate(req.getDateEmission(), "Date d'émission");
        LocalDate expiration = parseDate(req.getDateExpiration(), "Date d'expiration");
        if (expiration.isBefore(emission)) {
            throw new IllegalArgumentException("La date d'expiration doit être après la date d'émission.");
        }

        String typeBon = requireType(req.getTypeBon(), "restaurant");

        BonCommande b = BonCommande.builder()
                .numero(req.getNumero().trim())
                .fournisseur(f)
                .adherent(adherent)
                .typeBon(typeBon)
                .montant(req.getMontant())
                .valeurUnitaire(req.getValeurUnitaire())
                .quantiteTotale(quantite)
                .quantiteRestante(quantite)
                .statut(requireStatut(req.getStatut(), "brouillon"))
                .dateEmission(emission)
                .dateExpiration(expiration)
                .build();
        b = repo.save(b);

        // Pre-generate tickets. The numero pattern (BON-<i>) guarantees
        // global uniqueness because the bon's own numero is unique.
        List<TicketRestaurant> tickets = new ArrayList<>(quantite);
        for (int i = 1; i <= quantite; i++) {
            tickets.add(TicketRestaurant.builder()
                    .numero(b.getNumero() + "-" + String.format("%04d", i))
                    .typeBon(typeBon)
                    .montant(req.getValeurUnitaire())
                    .statut("en_attente")
                    .bonCommande(b)
                    .dateEmission(emission)
                    .build());
        }
        ticketRepository.saveAll(tickets);
        return BonCommandeDto.from(b);
    }

    /** Move a {@code brouillon} bon to {@code valide}. Idempotent. */
    @Transactional
    public BonCommandeDto valider(Long id) {
        BonCommande b = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bon de commande introuvable."));
        String s = b.getStatut() == null ? "" : b.getStatut().toLowerCase();
        if ("epuise".equals(s) || "expire".equals(s)) {
            throw new IllegalArgumentException("Ce bon ne peut plus être validé (statut : " + s + ").");
        }
        b.setStatut("valide");
        return BonCommandeDto.from(repo.save(b));
    }

    @Transactional
    public BonCommandeDto update(Long id, BonCommandeRequest req) {
        BonCommande b = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bon de commande introuvable."));

        boolean hasAssignedTickets =
                ticketRepository.countByBonCommandeIdAndStatut(b.getId(), "attribue") > 0;

        if (req.getNumero() != null && !req.getNumero().equalsIgnoreCase(b.getNumero())) {
            if (repo.existsByNumero(req.getNumero()))
                throw new IllegalArgumentException("Numéro déjà utilisé.");
            b.setNumero(req.getNumero());
        }
        if (req.getFournisseurId() != null) {
            Fournisseur f = fournisseurRepository.findById(req.getFournisseurId())
                    .orElseThrow(() -> new IllegalArgumentException("Fournisseur introuvable."));
            b.setFournisseur(f);
        }
        if (req.getAdherentId() != null) {
            User a = userRepository.findById(req.getAdherentId())
                    .orElseThrow(() -> new IllegalArgumentException("Adhérent introuvable."));
            b.setAdherent(a);
        }
        if (req.getTypeBon() != null) b.setTypeBon(requireType(req.getTypeBon(), b.getTypeBon()));
        if (req.getMontant() != null) {
            if (req.getMontant() <= 0) throw new IllegalArgumentException("Montant invalide.");
            if (hasAssignedTickets && !req.getMontant().equals(b.getMontant())) {
                throw new IllegalArgumentException(
                        "Impossible de modifier le montant : des tickets ont déjà été attribués.");
            }
            b.setMontant(req.getMontant());
        }
        if (req.getStatut() != null) b.setStatut(requireStatut(req.getStatut(), b.getStatut()));
        if (req.getDateEmission() != null) b.setDateEmission(parseDate(req.getDateEmission(), "Date d'émission"));
        if (req.getDateExpiration() != null) b.setDateExpiration(parseDate(req.getDateExpiration(), "Date d'expiration"));

        return BonCommandeDto.from(repo.save(b));
    }

    @Transactional
    public void delete(Long id) {
        BonCommande b = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bon de commande introuvable."));
        long assigned = ticketRepository.countByBonCommandeIdAndStatut(b.getId(), "attribue");
        if (assigned > 0) {
            throw new IllegalArgumentException(
                    "Impossible de supprimer : " + assigned + " ticket(s) déjà attribué(s).");
        }
        ticketRepository.deleteAll(ticketRepository.findByBonCommandeIdOrderByNumeroAsc(b.getId()));
        repo.deleteById(b.getId());
    }
}
