package com.project_pfe_srt.project_srt.service;

import com.project_pfe_srt.project_srt.dto.TicketDto;
import com.project_pfe_srt.project_srt.entity.User;
import com.project_pfe_srt.project_srt.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OffresService {

    private final TicketRepository ticketRepository;

    public List<TicketDto> listMyTickets(User user) {
        return ticketRepository.findByAdherentIdOrderByDateEmissionDesc(user.getId())
                .stream().map(TicketDto::from).toList();
    }
}
