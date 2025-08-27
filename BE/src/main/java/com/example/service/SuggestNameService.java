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

// ✅ FIXED SuggestNameService.java - Remove empty lines  
@Service
public class SuggestNameService {

    private static final String API_KEY = "AIzaSyAcfZKJCZpQZZIA7sVjHl-ss5apA8J083Y";
    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final String MODEL = "gemini-2.0-flash";
    private static final String GENERATE_CONTENT_ENDPOINT = ":generateContent?key=";

    public Map<String, Object> suggestNames(String language, String codeSnippet) {
        Map<String, Object> result = new HashMap<>();

        try {
            System.out.println("=== SUGGEST NAME SERVICE CALLED ===");

            String prompt = buildSuggestPrompt(language, codeSnippet);
            String requestBody = createRequestBody(prompt);
            String url = BASE_URL + MODEL + GENERATE_CONTENT_ENDPOINT + API_KEY;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            System.out.println("Gemini API Response Status: " + response.statusCode());

            if (response.statusCode() != 200) {
                result.put("suggestions", "❌ Lỗi HTTP " + response.statusCode() + ": " + response.body());
                return result;
            }

            return parseGeminiResponse(codeSnippet, response.body());

        } catch (Exception e) {
            System.err.println("❗ Error: " + e.getMessage());
            result.put("suggestions", "❗ Lỗi khi gọi Gemini API: " + e.getMessage());
        }
        return result;
    }

    // ✅ ENHANCED: Better prompt without empty lines
    private String buildSuggestPrompt(String language, String codeSnippet) {
        return String.format(
                "Bạn là chuyên gia naming convention cho %s. Phân tích code và đưa ra gợi ý tên tốt hơn:\n" +
                        "**NHIỆM VỤ:**\n" +
                        "1. Liệt kê tên biến/hàm hiện tại theo hàng dọc\n" +
                        "2. Đề xuất tên mới rõ ràng hơn\n" +
                        "3. Giải thích tại sao tên mới tốt hơn\n" +
                        "4. Quy tắc naming cho %s\n" +
                        "**YÊU CẦU:**\n" +
                        "- KHÔNG sửa code, chỉ gợi ý tên\n" +
                        "- Thứ tự xuất hiện Tên cũ - Tên mới - Giải thích và Theo tứ tự từng tên\n" +
                        "- KHÔNG để dòng trống\n" +
                        "- Tập trung vào naming convention\n" +
                        "**Code phân tích:**\n```%s\n%s\n```",
                language.toUpperCase(),
                language.toLowerCase(),
                language.toLowerCase(),
                codeSnippet);
    }

    private String createRequestBody(String prompt) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", new Object[] { part });
            Map<String, Object> body = Map.of("contents", new Object[] { content });
            return mapper.writeValueAsString(body);
        } catch (Exception e) {
            throw new RuntimeException("Error building JSON request body", e);
        }
    }

    // ✅ ENHANCED: Clean response parsing
    private Map<String, Object> parseGeminiResponse(String originalCode, String body) throws IOException {
        Map<String, Object> result = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(body);

        if (!root.has("candidates")) {
            result.put("suggestions", "⚠ Không nhận được phản hồi từ Gemini.");
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

        String suggestions = fullText.toString()
                .replaceAll("\n\\s*\n\\s*\n+", "\n\n") // Multiple empty lines -> double
                .replaceAll("(?m)^\\s*$\n", "") // Remove pure empty lines
                .trim();

        if (suggestions.isEmpty()) {
            suggestions = "⚠ Gemini không trả về gợi ý nào.";
        }

        String[] sentences = suggestions.split("\\. ");
        String summary = sentences.length > 2
                ? String.join(". ", sentences[0], sentences[1]) + "."
                : suggestions;

        if (summary.length() > 200) {
            summary = summary.substring(0, 200) + "...";
        }

        System.out.println("✅ Suggestions generated successfully, length: " + suggestions.length());

        result.put("originalCode", originalCode);
        result.put("suggestions", suggestions);
        result.put("summary", summary);
        result.put("success", true);
        return result;
    }
}