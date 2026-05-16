package com.project_pfe_srt.project_srt.treasurer.adherentview.controller;

import com.project_pfe_srt.project_srt.auth.dto.UserDto;
import com.project_pfe_srt.project_srt.auth.entity.Role;
import com.project_pfe_srt.project_srt.auth.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/treasurer/adherents")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TRESORIER','ADMIN')")
public class TreasurerAdherentController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<UserDto>> list() {
        List<UserDto> adherents = userRepository.findAllByRoleOrderByIdAsc(Role.ADHERENT).stream()
                .map(UserDto::from)
                .toList();
        return ResponseEntity.ok(adherents);
    }
}
