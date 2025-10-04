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

@Service
public class OptimizeService {

    // ⚠️ Đặt API_KEY trong config hoặc ENV thay vì hardcode
    private static final String API_KEY = "AIzaSyAl2n9dlc8ofWr8s4LZxV-M9bCLkTWLX8s";
    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final String MODEL = "gemini-2.0-flash"; // có thể đổi sang gemini-1.5-flash nếu quota hết
    private static final String ENDPOINT = ":generateContent?key=";

    private static final String CONTENT_TYPE = "application/json";
    private static final int HTTP_OK = 200;

    /**
     * Gọi Gemini API để tối ưu hóa code
     */
    public Map<String, Object> optimizeCode(String language, String codeSnippet) {
        Map<String, Object> result = new HashMap<>();

        // Ép kiểu về chuỗi, tránh null
        if (language == null) language = "Unknown";
        if (codeSnippet == null) codeSnippet = "";

        try {
            System.out.println("=== OPTIMIZE SERVICE CALLED ===");
            System.out.println("Language: " + language);
            System.out.println("Code snippet length: " + codeSnippet.length());

            // Prompt
            String prompt = buildOptimizePrompt(language, codeSnippet);

            // Request body JSON
            String requestBody = createRequestBody(prompt);

            String url = BASE_URL + MODEL + ENDPOINT + API_KEY;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", CONTENT_TYPE)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            System.out.println("Gemini API Response Status: " + response.statusCode());

            if (response.statusCode() != HTTP_OK) {
                result.put("success", false);
                result.put("optimizations", "❌ Lỗi HTTP " + response.statusCode() + ":\n" + response.body());
                return result;
            }

            return parseGeminiResponse(codeSnippet, response.body());

        } catch (IOException e) {
            result.put("success", false);
            result.put("optimizations", "❗ IO Error: " + e.getMessage());
        } catch (InterruptedException e) {
            result.put("success", false);
            result.put("optimizations", "❗ Request bị gián đoạn: " + e.getMessage());
        } catch (Exception e) {
            result.put("success", false);
            result.put("optimizations", "❗ Unknown error: " + e.getMessage());
            e.printStackTrace();
        }
        return result;
    }

    /**
     * Prompt tối ưu hóa code
     */
    private String buildOptimizePrompt(String language, String codeSnippet) {
        StringBuilder sb = new StringBuilder();

        sb.append("Bạn là một chuyên gia tối ưu hóa hiệu suất phần mềm (Performance Engineer).\n");
        sb.append("Hãy phân tích đoạn code ").append(language).append(" dưới đây và đưa ra các đề xuất tối ưu hóa chi tiết.\n\n");

        sb.append("## Nhiệm vụ chính:\n");
        sb.append("1. Phân tích hiệu suất hiện tại:\n");
        sb.append("   - Xác định bottlenecks\n");
        sb.append("   - Độ phức tạp Big O\n");
        sb.append("   - Memory usage\n");
        sb.append("2. Đề xuất tối ưu hóa:\n");
        sb.append("   - ⚡ Thuật toán\n");
        sb.append("   - 💾 Bộ nhớ\n");
        sb.append("   - 🔄 Vòng lặp\n");
        sb.append("   - 📊 Cấu trúc dữ liệu\n");
        sb.append("   - 🧵 Đồng thời/Async\n");
        sb.append("3. Benchmark: Ước tính cải thiện thời gian/memory\n");
        sb.append("4. Code ví dụ tối ưu\n\n");

        sb.append("## Format mong muốn:\n");
        sb.append("```\n");
        sb.append("## Performance Analysis\n");
        sb.append("- Current complexity: O(...)\n");
        sb.append("- Bottlenecks: [...]\n\n");
        sb.append("## Optimization Suggestions\n");
        sb.append("1. [Type]: [Description]\n");
        sb.append("   - Expected improvement: ...\n");
        sb.append("   - Difficulty: Easy/Medium/Hard\n");
        sb.append("```\n\n");

        sb.append("## Code cần tối ưu hóa:\n");
        sb.append("```").append(language).append("\n");
        sb.append(codeSnippet).append("\n```");

        return sb.toString();
    }

    /**
     * Body JSON gửi Gemini
     */
    private String createRequestBody(String prompt) {
        return "{ \"contents\": [ { \"parts\": [ { \"text\": \"" +
                prompt.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n") +
                "\" } ] } ] }";
    }

    /**
     * Xử lý response từ Gemini
     */
    private Map<String, Object> parseGeminiResponse(String originalCode, String body) throws IOException {
        Map<String, Object> result = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(body);

        if (!root.has("candidates")) {
            result.put("success", false);
            result.put("optimizations", "⚠ Không có phản hồi từ Gemini.");
            return result;
        }

        StringBuilder sb = new StringBuilder();
        for (JsonNode candidate : root.get("candidates")) {
            JsonNode parts = candidate.path("content").path("parts");
            for (JsonNode part : parts) {
                if (part.has("text")) {
                    sb.append(part.get("text").asText()).append("\n");
                }
            }
        }

        String optimizations = sb.toString().trim();
        if (optimizations.isEmpty()) {
            optimizations = "⚠ Gemini không trả về đề xuất tối ưu nào.";
        }

        String summary = "Đã phân tích hiệu suất code.";
        if (optimizations.toLowerCase().contains("optimization")) {
            summary = "Có các đề xuất tối ưu hóa cụ thể.";
        }

        result.put("success", true);
        result.put("originalCode", originalCode);
        result.put("optimizations", optimizations);
        result.put("summary", summary);

        return result;
    }
}
