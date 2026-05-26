package com.project_pfe_srt.project_srt.treasurer.ai.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PretAiAskRequest {

    @Size(max = 1000, message = "La question ne doit pas depasser 1000 caracteres.")
    private String question;
}
