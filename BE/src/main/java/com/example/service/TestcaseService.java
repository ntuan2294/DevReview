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
public class TestcaseService {

    // ✅ Sử dụng cùng config với các service khác
    private static final String API_KEY = "AIzaSyAl2n9dlc8ofWr8s4LZxV-M9bCLkTWLX8s";
    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final String MODEL = "gemini-2.0-flash";
    private static final String GENERATE_CONTENT_ENDPOINT = ":generateContent?key=";
    private static final String CONTENT_TYPE = "application/json";
    private static final int HTTP_OK = 200;

    /**
     * Sinh test cases cho đoạn code
     */
    public Map<String, Object> generateTestcases(String language, String codeSnippet) {
        Map<String, Object> result = new HashMap<>();

        try {
            System.out.println("=== TESTCASE SERVICE CALLED ===");
            System.out.println("Language: " + language);
            System.out.println("Code snippet length: " + (codeSnippet != null ? codeSnippet.length() : 0));

            String prompt = buildTestcasePrompt(language, codeSnippet);
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
                result.put("testcases", "❌ Lỗi HTTP " + response.statusCode() + ":\n" + response.body());
                return result;
            }

            return parseGeminiResponse(codeSnippet, response.body());

        } catch (IOException e) {
            System.err.println("❗ IO Error khi gọi Gemini API: " + e.getMessage());
            result.put("testcases", "❗ Lỗi IO khi gọi Gemini API: " + e.getMessage());
        } catch (InterruptedException e) {
            System.err.println("❗ Interrupted khi gọi Gemini API: " + e.getMessage());
            result.put("testcases", "❗ Gọi Gemini API bị gián đoạn: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("❗ Unknown error: " + e.getMessage());
            e.printStackTrace();
            result.put("testcases", "❗ Lỗi không xác định khi gọi Gemini API: " + e.getMessage());
        }
        return result;
    }

    /**
     * Tạo prompt chuyên biệt cho sinh testcase
     */
    private String buildTestcasePrompt(String language, String codeSnippet) {
        String safeCode = codeSnippet.replace("\\", "\\\\").replace("\"", "\\\"");

        return String.format(
                "Bạn là một chuyên gia kiểm thử phần mềm (QA Engineer). "
                        + "Hãy phân tích đoạn mã %s dưới đây và tạo ra các TEST CASES chi tiết:\n\n"
                        + "**Nhiệm vụ:**\n"
                        + "1. **Phân tích chức năng**: Hiểu rõ đoạn code làm gì.\n"
                        + "2. **Test cases bao phủ**: Tạo test cases cho:\n"
                        + "   - ✅ **Happy path** (trường hợp bình thường)\n"
                        + "   - ⚠️ **Edge cases** (trường hợp biên)\n"
                        + "   - ❌ **Error cases** (trường hợp lỗi)\n"
                        + "   - 🔍 **Corner cases** (trường hợp đặc biệt)\n"
                        + "3. **Input/Output cụ thể**: Mỗi test case phải có:\n"
                        + "   - **Input**: Dữ liệu đầu vào cụ thể\n"
                        + "   - **Expected Output**: Kết quả mong đợi\n"
                        + "   - **Description**: Mô tả test case\n"
                        + "4. **Format dễ đọc**: Sử dụng bảng hoặc danh sách có cấu trúc.\n\n"
                        + "**Ví dụ format mong muốn:**\n"
                        + "```\n"
                        + "## Test Case 1: Happy Path\n"
                        + "- **Input**: [giá trị cụ thể]\n"
                        + "- **Expected Output**: [kết quả mong đợi]\n"
                        + "- **Description**: [mô tả ngắn gọn]\n"
                        + "```\n\n"
                        + "**Lưu ý quan trọng:**\n"
                        + "- ❌ KHÔNG viết code test, chỉ mô tả test cases\n"
                        + "- ✅ Tập trung vào data và expected results\n"
                        + "- ✅ Bao phủ nhiều scenarios khác nhau\n"
                        + "- ✅ Phù hợp với ngôn ngữ %s\n\n"
                        + "**Đoạn code cần tạo test cases:**\n```%s\n%s\n```",
                language.toUpperCase(), // %s đầu tiên
                language.toLowerCase(), // %s thứ hai
                language.toLowerCase(), // %s thứ ba
                safeCode); // %s cuối cùng
    }

    /**
     * Tạo request body cho Gemini API
     */
    private String createRequestBody(String prompt) {
        return String.format(
                "{ \"contents\": [ { \"parts\": [ { \"text\": \"%s\" } ] } ] }",
                prompt.replace("\n", "\\n").replace("\"", "\\\""));
    }

    /**
     * Parse response từ Gemini API
     */
    private Map<String, Object> parseGeminiResponse(String originalCode, String body) throws IOException {
        Map<String, Object> result = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(body);

        if (!root.has("candidates")) {
            result.put("testcases", "⚠ Không nhận được phản hồi từ Gemini.");
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

        String testcases = fullText.toString().trim();

        if (testcases.isEmpty()) {
            testcases = "⚠ Gemini không trả về test cases nào.";
        }

        // Tạo summary (2-3 câu đầu tiên về số lượng test cases)
        String[] lines = testcases.split("\n");
        String summary = "Đã tạo test cases";
        
        // Đếm số test cases (tìm các dòng chứa "Test Case" hoặc "##")
        int testCaseCount = 0;
        for (String line : lines) {
            if (line.toLowerCase().contains("test case") || line.startsWith("##")) {
                testCaseCount++;
            }
        }
        
        if (testCaseCount > 0) {
            summary = String.format("Đã tạo %d test cases bao gồm happy path, edge cases và error cases.", testCaseCount);
        }

        System.out.println("✅ Test cases generated successfully, length: " + testcases.length() + ", count: " + testCaseCount);

        result.put("originalCode", originalCode);
        result.put("testcases", testcases);
        result.put("summary", summary);
        result.put("success", true);
        return result;
    }
}