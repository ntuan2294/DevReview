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
public class ExplainService {

    // Nên load từ biến môi trường thay vì hardcode
    private static final String API_KEY = "AIzaSyAcfZKJCZpQZZIA7sVjHl-ss5apA8J083Y";
    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final String MODEL = "gemini-2.0-flash";
    private static final String GENERATE_CONTENT_ENDPOINT = ":generateContent?key=";
    private static final String CONTENT_TYPE = "application/json";
    private static final int HTTP_OK = 200;

    /**
     * Giải thích đoạn code được truyền vào
     */
    public Map<String, Object> explainCode(String language, String codeSnippet) {
        Map<String, Object> result = new HashMap<>();

        try {
            String prompt = buildPrompt(language, codeSnippet);
            String requestBody = createRequestBody(prompt);
            String url = BASE_URL + MODEL + GENERATE_CONTENT_ENDPOINT + API_KEY;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", CONTENT_TYPE)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();

            HttpClient client = HttpClient.newHttpClient();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != HTTP_OK) {
                result.put("explanation", "❌ Lỗi HTTP " + response.statusCode() + ":\n" + response.body());
                return result;
            }

            return parseGeminiResponse(codeSnippet, response.body());

        } catch (IOException e) {
            result.put("explanation", "❗ Lỗi IO khi gọi Gemini API: " + e.getMessage());
        } catch (InterruptedException e) {
            result.put("explanation", "❗ Gọi Gemini API bị gián đoạn: " + e.getMessage());
        } catch (Exception e) {
            result.put("explanation", "❗ Lỗi không xác định khi gọi Gemini API: " + e.getMessage());
        }
        return result;
    }

    /**
     * Prompt yêu cầu Gemini giải thích code
     */
    private String buildPrompt(String language, String codeSnippet) {
        String safeCode = codeSnippet.replace("\\", "\\\\").replace("\"", "\\\"");

        return String.format(
                "Bạn là một chuyên gia lập trình. "
                        + "Hãy phân tích và GIẢI THÍCH chi tiết đoạn mã %s dưới đây một cách dễ hiểu cho người mới học lập trình:\n\n"
                        + "1. Giới thiệu ngắn gọn mục đích của đoạn mã.\n"
                        + "2. Giải thích chức năng của từng thành phần (hàm, lớp, biến, vòng lặp...).\n"
                        + "3. Mô tả luồng hoạt động tổng thể (cách các phần kết hợp để chạy chương trình).\n"
                        + "4. Nếu có thể, hãy đưa ví dụ minh họa cách đoạn mã này hoạt động.\n\n"
                        + "❌ Không cần kiểm tra lỗi hoặc gợi ý cải tiến.\n\n"
                        + "❌ Không để các dòng trống\"\n\n"
                        + "Đây là đoạn code:\n```%s\n%s\n```",
                language.toUpperCase(), language.toLowerCase(), safeCode);

    }

    private String createRequestBody(String prompt) {
        return String.format(
                "{ \"contents\": [ { \"parts\": [ { \"text\": \"%s\" } ] } ] }",
                prompt.replace("\n", "\\n"));
    }

    /**
     * Xử lý response từ Gemini
     */
    private Map<String, Object> parseGeminiResponse(String originalCode, String body) throws IOException {
        Map<String, Object> result = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(body);

        if (!root.has("candidates")) {
            result.put("explanation", "⚠ Không nhận được phản hồi từ Gemini.");
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

        String explanation = fullText.toString().trim();

        // Lấy summary (1-2 câu đầu tiên)
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
