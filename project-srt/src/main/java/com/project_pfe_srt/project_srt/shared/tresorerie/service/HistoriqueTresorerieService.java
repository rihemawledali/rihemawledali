package com.project_pfe_srt.project_srt.shared.tresorerie.service;

import com.project_pfe_srt.project_srt.shared.tresorerie.dto.HistoriqueTresorerieDto;
import com.project_pfe_srt.project_srt.shared.tresorerie.repository.HistoriqueTresorerieRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HistoriqueTresorerieService {

    private final HistoriqueTresorerieRepository repo;

    public List<HistoriqueTresorerieDto> list() {
        return repo.findAllByOrderByDateDesc().stream()
                .map(HistoriqueTresorerieDto::from).toList();
    }

    public List<HistoriqueTresorerieDto> search(String type, String sourceType, String from, String to) {
        LocalDateTime dFrom = from == null || from.isBlank() ? null : LocalDate.parse(from).atStartOfDay();
        LocalDateTime dTo = to == null || to.isBlank() ? null : LocalDate.parse(to).atTime(23, 59, 59);
        String t = type == null || type.isBlank() ? null : type;
        String st = sourceType == null || sourceType.isBlank() ? null : sourceType;
        return repo.search(t, st, dFrom, dTo).stream()
                .map(HistoriqueTresorerieDto::from).toList();
    }
}
