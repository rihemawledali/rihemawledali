package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.HistoriqueDto;
import com.project_pfe_srt.project_srt.entity.User;
import com.project_pfe_srt.project_srt.repository.HistoriqueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HistoriqueService {

    private final HistoriqueRepository historiqueRepository;

    private static LocalDate parseOrNull(String v) {
        if (v == null || v.isBlank()) return null;
        try {
            return LocalDate.parse(v.length() >= 10 ? v.substring(0, 10) : v);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Date invalide : " + v);
        }
    }

    public List<HistoriqueDto> search(User user, String type, String dateDebut, String dateFin) {
        String t = (type == null || type.isBlank()) ? null : type.toLowerCase();
        return historiqueRepository
                .search(user.getId(), t, parseOrNull(dateDebut), parseOrNull(dateFin))
                .stream().map(HistoriqueDto::from).toList();
    }
}
