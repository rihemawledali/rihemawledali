package com.project_pfe_srt.project_srt.treasurer.ai.service;

import com.project_pfe_srt.project_srt.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OpenAiPretAssistantClient {

    private final ObjectMapper objectMapper;

    @Value("${app.ai.openai.api-key}")
    private String apiKey;

    @Value("${app.ai.openai.base-url:https://api.ecomagent.in/v1}")
    private String baseUrl;

    @Value("${app.ai.openai.model:claude-opus-4.6}")
    private String model;

    @Value("${app.ai.openai.max-tokens:900}")
    private Integer maxTokens;

    public String ask(String systemPrompt, String userPrompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Service AI non configure.");
        }

        try {
            URI endpoint = URI.create(resolveEndpointUrl());
            String payload = endpoint.toString().endsWith("/responses")
                    ? responsesPayload(systemPrompt, userPrompt)
                    : chatCompletionsPayload(systemPrompt, userPrompt);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(endpoint)
                    .timeout(Duration.ofSeconds(45))
                    .header("Authorization", authorizationHeader())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ApiException(
                        HttpStatus.BAD_GATEWAY,
                        "Service AI indisponible (HTTP " + response.statusCode() + "): "
                                + extractErrorMessage(response.body())
                );
            }

            return extractAnswer(response.body());
        } catch (ApiException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Service AI indisponible.");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Service AI interrompu.");
        }
    }

    private String chatCompletionsPayload(String systemPrompt, String userPrompt) throws IOException {
        return objectMapper.writeValueAsString(Map.of(
                "model", model,
                "temperature", 0.2,
                "max_tokens", maxTokens == null || maxTokens <= 0 ? 900 : maxTokens,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                )
        ));
    }

    private String responsesPayload(String systemPrompt, String userPrompt) throws IOException {
        return objectMapper.writeValueAsString(Map.of(
                "model", model,
                "temperature", 0.2,
                "max_output_tokens", maxTokens == null || maxTokens <= 0 ? 900 : maxTokens,
                "input", List.of(
                        responsesMessage("developer", systemPrompt),
                        responsesMessage("user", userPrompt)
                )
        ));
    }

    private Map<String, Object> responsesMessage(String role, String text) {
        return Map.of(
                "role", role,
                "content", List.of(Map.of(
                        "type", "input_text",
                        "text", text
                ))
        );
    }

    private String resolveEndpointUrl() {
        String url = baseUrl == null || baseUrl.isBlank()
                ? "https://api.ecomagent.in/v1"
                : baseUrl.trim();
        while (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        if (url.endsWith("/chat/completions") || url.endsWith("/responses")) {
            return url;
        }
        return url + "/chat/completions";
    }

    private String authorizationHeader() {
        String trimmed = apiKey.trim();
        return trimmed.regionMatches(true, 0, "Bearer ", 0, "Bearer ".length())
                ? trimmed
                : "Bearer " + trimmed;
    }

    private String extractAnswer(String body) throws IOException {
        JsonNode root = objectMapper.readTree(body);
        for (JsonNode choice : root.path("choices")) {
            JsonNode content = choice.path("message").path("content");
            if (content.isTextual() && !content.asText().isBlank()) {
                return content.asText();
            }
            if (content.isArray()) {
                String text = textFromContentArray(content);
                if (!text.isBlank()) {
                    return text;
                }
            }
        }

        JsonNode outputText = root.path("output_text");
        if (outputText.isTextual() && !outputText.asText().isBlank()) {
            return outputText.asText();
        }

        for (JsonNode item : root.path("output")) {
            for (JsonNode content : item.path("content")) {
                JsonNode text = content.path("text");
                if (text.isTextual() && !text.asText().isBlank()) {
                    return text.asText();
                }
            }
        }

        throw new ApiException(HttpStatus.BAD_GATEWAY, "Reponse AI invalide.");
    }

    private String extractErrorMessage(String body) {
        if (body == null || body.isBlank()) {
            return "reponse vide du fournisseur.";
        }
        JsonNode root = objectMapper.readTree(body);
        JsonNode error = root.path("error");
        if (error.isTextual() && !error.asText().isBlank()) {
            return error.asText();
        }
        if (error.isObject()) {
            String type = error.path("type").asText("");
            String message = error.path("message").asText("");
            if (!type.isBlank() && !message.isBlank()) {
                return type + " - " + message;
            }
            if (!message.isBlank()) {
                return message;
            }
        }
        JsonNode message = root.path("message");
        if (message.isTextual() && !message.asText().isBlank()) {
            return message.asText();
        }
        String compact = body.replaceAll("\\s+", " ").trim();
        return compact.length() <= 220 ? compact : compact.substring(0, 220) + "...";
    }

    private String textFromContentArray(JsonNode content) {
        StringBuilder out = new StringBuilder();
        for (JsonNode part : content) {
            JsonNode text = part.path("text");
            if (text.isTextual() && !text.asText().isBlank()) {
                if (!out.isEmpty()) {
                    out.append('\n');
                }
                out.append(text.asText());
            }
        }
        return out.toString();
    }
}
