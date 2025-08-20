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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AIService {

  // Nên load từ biến môi trường thay vì hardcode
  private static final String API_KEY = "AIzaSyAMU4ChLP876TnowgNxEXy6EfkAK7Q1YKU";
  private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
  private static final String MODEL = "gemini-2.0-flash";
  private static final String GENERATE_CONTENT_ENDPOINT = ":generateContent?key=";
  private static final String CONTENT_TYPE = "application/json";
  private static final int HTTP_OK = 200;

  // Regex code block mềm hơn (bắt cả trường hợp có/không tên ngôn ngữ và khoảng
  // trắng)
  private static final Pattern CODE_PATTERN = Pattern.compile(
      "```\\s*([a-zA-Z0-9]*)?\\s*\\n?([\\s\\S]*?)```",
      Pattern.MULTILINE);

  public Map<String, Object> reviewCode(String language, String codeSnippet) {
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
        result.put("feedback", "❌ Lỗi HTTP " + response.statusCode() + ":\n" + response.body());
        return result;
      }

      return parseGeminiResponse(codeSnippet, response.body());

    } catch (IOException e) {
      result.put("feedback", "❗ Lỗi IO khi gọi Gemini API: " + e.getMessage());
    } catch (InterruptedException e) {
      result.put("feedback", "❗ Gọi Gemini API bị gián đoạn: " + e.getMessage());
    } catch (Exception e) {
      result.put("feedback", "❗ Lỗi không xác định khi gọi Gemini API: " + e.getMessage());
    }
    return result;
  }

  private String buildPrompt(String language, String codeSnippet) {
    String safeCode = codeSnippet.replace("\\", "\\\\").replace("\"", "\\\"");

    return String.format(
        "Bạn là một chuyên gia đánh giá mã nguồn. "
            + "Hãy phân tích đoạn mã %s sau đây và trả lời đúng format:\n\n"
            + "1. Liệt kê lỗi logic (nếu có, nếu không ghi 'Không có lỗi logic').\n"
            + "2. Cảnh báo phong cách lập trình (nếu không có ghi 'Không có vấn đề về phong cách').\n"
            + "3. Gợi ý cải thiện.\n"
            + "4. Viết lại code đã cải thiện, đặt trong code block markdown đúng chuẩn:\n```%s\n[your code here]\n```\n"
            + "5. Tóm tắt ngắn gọn kết quả review (1-2 câu).\n\n"
            + "Đây là đoạn code:\n%s",
        language.toUpperCase(), language.toLowerCase(), safeCode);
  }

  private String createRequestBody(String prompt) {
    return String.format(
        "{ \"contents\": [ { \"parts\": [ { \"text\": \"%s\" } ] } ] }",
        prompt.replace("\n", "\\n"));
  }

  private Map<String, Object> parseGeminiResponse(String originalCode, String body) throws IOException {
    Map<String, Object> result = new HashMap<>();
    ObjectMapper mapper = new ObjectMapper();
    JsonNode root = mapper.readTree(body);

    if (!root.has("candidates")) {
      result.put("feedback", "⚠ Không nhận được phản hồi từ Gemini.");
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

    String allText = fullText.toString().trim();

    // 1️⃣ Tìm code đã cải thiện
    Matcher matcher = CODE_PATTERN.matcher(allText);
    String improvedCode = "";
    if (matcher.find()) {
      improvedCode = matcher.group(2).trim(); // group(2) là phần code
    }

    // 2️⃣ Loại bỏ code block khỏi feedback
    String feedbackWithoutCode = allText.replaceAll("```[a-zA-Z0-9]*\\s*\\n[\\s\\S]*?```", "").trim();

    // 3️⃣ Lấy summary (1-2 câu đầu)
    String[] sentences = feedbackWithoutCode.split("\\. ");
    String summary = sentences.length > 2
        ? String.join(". ", sentences[0], sentences[1]) + "."
        : feedbackWithoutCode;

    // 4️⃣ Gán vào kết quả
    result.put("originalCode", originalCode);
    result.put("feedback", feedbackWithoutCode);
    result.put("improvedCode", improvedCode.isEmpty() ? "⚠ Không tìm thấy code đã sửa." : improvedCode);
    result.put("summary", summary);
    return result;
  }
}
