package com.project_pfe_srt.project_srt.common.web;

import java.util.Map;

public record ErrorBody(String error, Map<String, String> fields) {

    public static ErrorBody of(String error) {
        return new ErrorBody(error, null);
    }
}
