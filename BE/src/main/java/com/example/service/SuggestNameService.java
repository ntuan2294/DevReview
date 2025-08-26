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
public class SuggestNameService {

    // ✅ Sử dụng cùng config với AIService và ExplainService
    private static final String API_KEY = "AIzaSyAcfZKJCZpQZZIA7sVjHl-ss5apA8J083Y";
    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final String MODEL = "gemini-2.0-flash";
    private static final String GENERATE_CONTENT_ENDPOINT = ":generateContent?key=";
    private static final String CONTENT_TYPE = "application/json";
    private static final int HTTP_OK = 200;

    /**
     * Gợi ý tên hàm và biến tốt hơn cho đoạn code
     */
    public Map<String, Object> suggestNames(String language, String codeSnippet) {
        Map<String, Object> result = new HashMap<>();

        try {
            System.out.println("=== SUGGEST NAME SERVICE CALLED ===");
            System.out.println("Language: " + language);
            System.out.println("Code snippet length: " + (codeSnippet != null ? codeSnippet.length() : 0));

            String prompt = buildSuggestPrompt(language, codeSnippet);
            String requestBody = createRequestBody(prompt);
            String url = BASE_URL + MODEL + GENERATE_CONTENT_ENDPOINT + API_KEY;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", CONTENT_TYPE)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            System.out.println("Gemini API Response Status: " + response.statusCode());

            if (response.statusCode() != HTTP_OK) {
                result.put("suggestions", "❌ Lỗi HTTP " + response.statusCode() + ":\n" + response.body());
                return result;
            }

            return parseGeminiResponse(codeSnippet, response.body());

        } catch (IOException e) {
            System.err.println("❗ IO Error khi gọi Gemini API: " + e.getMessage());
            result.put("suggestions", "❗ Lỗi IO khi gọi Gemini API: " + e.getMessage());
        } catch (InterruptedException e) {
            System.err.println("❗ Interrupted khi gọi Gemini API: " + e.getMessage());
            result.put("suggestions", "❗ Gọi Gemini API bị gián đoạn: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("❗ Unknown error: " + e.getMessage());
            e.printStackTrace();
            result.put("suggestions", "❗ Lỗi không xác định khi gọi Gemini API: " + e.getMessage());
        }
        return result;
    }

    /**
     * Tạo prompt chuyên biệt cho suggest names
     */
    private String buildSuggestPrompt(String language, String codeSnippet) {
        String safeCode = codeSnippet.replace("\\", "\\\\").replace("\"", "\\\"");

        return String.format(
                "Bạn là một chuyên gia lập trình với kinh nghiệm đặt tên biến, hàm, class tốt. "
                        + "Hãy phân tích đoạn mã %s dưới đây và đưa ra GỢI Ý TÊN tốt hơn:\n\n"
                        + "**Nhiệm vụ:**\n"
                        + "1. Liệt kê các tên hàm/biến/class hiện tại trong code.\n"
                        + "2. Đề xuất tên mới rõ ràng, có ý nghĩa hơn.\n"
                        + "3. Giải thích tại sao tên mới tốt hơn (dễ hiểu, theo convention).\n"
                        + "4. Đưa ra quy tắc đặt tên tốt cho ngôn ngữ %s.\n\n"
                        + "**Lưu ý:** \n"
                        + "- ❌ KHÔNG sửa code, chỉ gợi ý tên.\n"
                        + "- ❌ KHÔNG hiện kết quả ở dạng bảng.\n"
                        + "- ❌ KHÔNG để dòng trống"
                        + "- ✅ Tập trung vào naming convention chuẩn của %s.\n"
                        + "- ✅ Đề xuất tên có ý nghĩa, dễ hiểu.\n"
                        + "- ✅ Giải thích lý do tại sao tên mới tốt hơn.\n\n"
                        + "**Đoạn code cần phân tích:**\n```%s\n%s\n```",
                language.toUpperCase(), // %s đầu tiên
                language.toLowerCase(), // %s thứ hai
                language.toLowerCase(), // %s thứ ba
                language.toLowerCase(), // %s thứ tư
                safeCode); // %s cuối cùng
    }

    /**
     * Tạo request body cho Gemini API
     */
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

    /**
     * Parse response từ Gemini API
     */
    private Map<String, Object> parseGeminiResponse(String originalCode, String body) throws IOException {
        Map<String, Object> result = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(body);

        if (!root.has("candidates")) {
            result.put("suggestions", "⚠ Không nhận được phản hồi từ Gemini.");
            return result;
        }

        // Lấy toàn bộ text trả về
        StringBuilder fullText = new StringBuilder();
        for (JsonNode candidate : root.get("candidates")) {
            JsonNode parts = candidate.path("content").path("parts");
            for (JsonNode part : parts) {
                if (part.has("text")) {
                    fullText.append(part.get("text").asText()).append("\n");
                }
            }
        }

        String suggestions = fullText.toString().trim();

        if (suggestions.isEmpty()) {
            suggestions = "⚠ Gemini không trả về gợi ý nào.";
        }

        // Tạo summary (1-2 câu đầu tiên)
        String[] sentences = suggestions.split("\\. ");
        String summary = sentences.length > 2
                ? String.join(". ", sentences[0], sentences[1]) + "."
                : suggestions;

        // Trim summary nếu quá dài
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