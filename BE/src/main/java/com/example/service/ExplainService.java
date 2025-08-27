package com.example.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

// ✅ FIXED ExplainService.java - Remove empty lines
@Service
public class ExplainService {

    private static final String API_KEY = "AIzaSyAcfZKJCZpQZZIA7sVjHl-ss5apA8J083Y";
    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final String MODEL = "gemini-2.0-flash";
    private static final String GENERATE_CONTENT_ENDPOINT = ":generateContent?key=";

    public Map<String, Object> explainCode(String language, String codeSnippet) {
        Map<String, Object> result = new HashMap<>();

        try {
            String prompt = buildPrompt(language, codeSnippet);
            String requestBody = createRequestBody(prompt);
            String url = BASE_URL + MODEL + GENERATE_CONTENT_ENDPOINT + API_KEY;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                result.put("explanation", "❌ Lỗi HTTP " + response.statusCode() + ": " + response.body());
                return result;
            }

            return parseGeminiResponse(codeSnippet, response.body());

        } catch (Exception e) {
            result.put("explanation", "❗ Lỗi khi gọi Gemini API: " + e.getMessage());
        }
        return result;
    }

    // ✅ ENHANCED: Better prompt without empty lines
    private String buildPrompt(String language, String codeSnippet) {
        return String.format(
                "Bạn là chuyên gia lập trình. Hãy GIẢI THÍCH chi tiết đoạn mã %s:\n" +
                        "**YÊU CẦU:**\n" +
                        "1. Tóm tắt mục đích của code\n" +
                        "2. Giải thích từng thành phần quan trọng\n" +
                        "3. Mô tả luồng thực thi\n" +
                        "4. Ví dụ minh họa (nếu có thể)\n" +
                        "**LƯU Ý:**\n" +
                        "- KHÔNG kiểm tra lỗi\n" +
                        "- KHÔNG để dòng trống\n" +
                        "- Chỉ tập trung GIẢI THÍCH\n" +
                        "**Code:**\n```%s\n%s\n```",
                language.toUpperCase(),
                language.toLowerCase(),
                codeSnippet);
    }

    private String createRequestBody(String prompt) {
        return String.format(
                "{ \"contents\": [ { \"parts\": [ { \"text\": \"%s\" } ] } ] }",
                prompt.replace("\n", "\\n").replace("\"", "\\\""));
    }

    // ✅ ENHANCED: Clean response parsing
    private Map<String, Object> parseGeminiResponse(String originalCode, String body) throws IOException {
        Map<String, Object> result = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(body);

        if (!root.has("candidates")) {
            result.put("explanation", "⚠ Không nhận được phản hồi từ Gemini.");
            return result;
        }

        StringBuilder fullText = new StringBuilder();
        for (JsonNode candidate : root.get("candidates")) {
            JsonNode parts = candidate.path("content").path("parts");
            for (JsonNode part : parts) {
                if (part.has("text")) {
                    fullText.append(part.get("text").asText()).append("\n");
                }
            }
        }

        String explanation = fullText.toString()
                .replaceAll("\n\\s*\n\\s*\n+", "\n\n") // Multiple empty lines -> double
                .replaceAll("(?m)^\\s*$\n", "") // Remove pure empty lines
                .trim();

        String[] sentences = explanation.split("\\. ");
        String summary = sentences.length > 2
                ? String.join(". ", sentences[0], sentences[1]) + "."
                : explanation;

        result.put("originalCode", originalCode);
        result.put("explanation", explanation);
        result.put("summary", summary);
        return result;
    }
}
