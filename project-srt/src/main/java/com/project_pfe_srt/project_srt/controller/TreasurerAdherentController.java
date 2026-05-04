package com.project_pfe_srt.project_srt.controller;

import com.project_pfe_srt.project_srt.dto.UserDto;
import com.project_pfe_srt.project_srt.entity.Role;
import com.project_pfe_srt.project_srt.repository.UserRepository;
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
        List<UserDto> adherents = userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.ADHERENT)
                .map(UserDto::from)
                .toList();
        return ResponseEntity.ok(adherents);
    }
}
