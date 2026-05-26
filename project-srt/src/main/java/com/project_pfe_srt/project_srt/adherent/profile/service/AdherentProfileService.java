package com.project_pfe_srt.project_srt.adherent.profile.service;

import com.project_pfe_srt.project_srt.adherent.profile.dto.AdherentProfileDto;
import com.project_pfe_srt.project_srt.adherent.profile.entity.AdherentProfile;
import com.project_pfe_srt.project_srt.adherent.profile.repository.AdherentProfileRepository;
import com.project_pfe_srt.project_srt.auth.entity.User;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdherentProfileService {

    private final AdherentProfileRepository profileRepository;

    public AdherentProfile getOrCreate(User user) {
        return profileRepository.findById(user.getId())
                .orElseGet(() -> {
                    AdherentProfile fresh = AdherentProfile.builder()
                            .user(user)
                            .build();
                    return profileRepository.save(fresh);
                });
    }

    public AdherentProfileDto getProfileDto(User user) {
        return AdherentProfileDto.from(user, getOrCreate(user));
    }
}
