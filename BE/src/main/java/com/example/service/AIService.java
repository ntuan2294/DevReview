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
import java.util.List;
import java.util.ArrayList;

@Service
public class AIService {

  private static final String API_KEY = "AIzaSyAcfZKJCZpQZZIA7sVjHl-ss5apA8J083Y";
  private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
  private static final String MODEL = "gemini-2.0-flash";
  private static final String GENERATE_CONTENT_ENDPOINT = ":generateContent?key=";
  private static final String CONTENT_TYPE = "application/json";
  private static final int HTTP_OK = 200;

  // Regex để tìm code blocks
  private static final Pattern CODE_PATTERN = Pattern.compile(
      "```\\s*([a-zA-Z0-9]*)?\\s*\\n?([\\s\\S]*?)```",
      Pattern.MULTILINE);

  // ✅ THÊM: Regex để tìm vị trí lỗi trong response
  private static final Pattern ERROR_LINE_PATTERN = Pattern.compile(
      "(?:dòng|line)\\s*(\\d+)(?:\\s*[:-]\\s*\\d+)?",
      Pattern.CASE_INSENSITIVE);

  public Map<String, Object> reviewCode(String language, String codeSnippet) {
    Map<String, Object> result = new HashMap<>();

    try {
      // ✅ THÊM: Đánh số dòng trong code snippet gửi cho AI
      String numberedCode = addLineNumbers(codeSnippet);
      String prompt = buildEnhancedPrompt(language, numberedCode);
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

      return parseEnhancedGeminiResponse(codeSnippet, response.body());

    } catch (IOException e) {
      result.put("feedback", "❗ Lỗi IO khi gọi Gemini API: " + e.getMessage());
    } catch (InterruptedException e) {
      result.put("feedback", "❗ Gọi Gemini API bị gián đoạn: " + e.getMessage());
    } catch (Exception e) {
      result.put("feedback", "❗ Lỗi không xác định khi gọi Gemini API: " + e.getMessage());
    }
    return result;
  }

  // ✅ THÊM: Method để thêm số dòng vào code
  private String addLineNumbers(String code) {
    String[] lines = code.split("\n");
    StringBuilder numberedCode = new StringBuilder();

    for (int i = 0; i < lines.length; i++) {
      numberedCode.append(String.format("%d: %s\n", i + 1, lines[i]));
    }

    return numberedCode.toString();
  }

  // ✅ CẬP NHẬT: Prompt yêu cầu AI chỉ rõ số dòng bị lỗi
  private String buildEnhancedPrompt(String language, String numberedCode) {
    return String.format(
        "Bạn là một chuyên gia đánh giá mã nguồn. "
            + "Hãy phân tích đoạn mã %s sau đây và trả lời đúng format:\n\n"
            + "**QUAN TRỌNG**: Khi phát hiện lỗi, hãy CHỈ RÕ SỐ DÒNG cụ thể bằng cách viết 'Dòng X:' hoặc 'Line X:'\n\n"
            + "1. **Lỗi logic và cú pháp** (nếu có, chỉ rõ dòng cụ thể):\n"
            + "   - Dòng X: [mô tả lỗi]\n"
            + "   - Dòng Y: [mô tả lỗi]\n"
            + "   (Nếu không có lỗi ghi 'Không có lỗi')\n\n"
            + "2. **Cảnh báo phong cách lập trình**:\n"
            + "   (Nếu không có ghi 'Không có vấn đề về phong cách')\n\n"
            + "3. **Gợi ý cải thiện**:\n\n"
            + "4. **Code đã cải thiện**:\n"
            + "```%s\n[your improved code here]\n```\n\n"
            + "Đây là đoạn code có đánh số dòng:\n%s"
            + "Không để các dòng trống",
        language.toUpperCase(),
        language.toLowerCase(),
        numberedCode);
  }

  private String createRequestBody(String prompt) {
    return String.format(
        "{ \"contents\": [ { \"parts\": [ { \"text\": \"%s\" } ] } ] }",
        prompt.replace("\n", "\\n").replace("\"", "\\\""));
  }

  // ✅ CẬP NHẬT: Parse response và extract error lines
  private Map<String, Object> parseEnhancedGeminiResponse(String originalCode, String body) throws IOException {
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
      improvedCode = matcher.group(2).trim();
    }

    // 2️⃣ ✅ THÊM: Extract error lines từ feedback
    List<Integer> errorLines = extractErrorLines(allText);

    // 3️⃣ Loại bỏ code block khỏi feedback
    String feedbackWithoutCode = allText.replaceAll("```[a-zA-Z0-9]*\\s*\\n[\\s\\S]*?```", "").trim();

    // 4️⃣ Lấy summary
    String[] sentences = feedbackWithoutCode.split("\\. ");
    String summary = sentences.length > 2
        ? String.join(". ", sentences[0], sentences[1]) + "."
        : feedbackWithoutCode;

    // 5️⃣ ✅ THÊM: Gán kết quả bao gồm error lines
    result.put("originalCode", originalCode);
    result.put("feedback", feedbackWithoutCode);
    result.put("improvedCode", improvedCode.isEmpty() ? "⚠ Không tìm thấy code đã sửa." : improvedCode);
    result.put("summary", summary);
    result.put("errorLines", errorLines); // ✅ THÊM field mới

    // ✅ Log để debug
    System.out.println("📍 Error lines detected: " + errorLines);

    return result;
  }

  // ✅ THÊM: Method extract error lines từ AI response
  private List<Integer> extractErrorLines(String feedback) {
    List<Integer> errorLines = new ArrayList<>();

    try {
      Matcher matcher = ERROR_LINE_PATTERN.matcher(feedback);
      while (matcher.find()) {
        String lineNumberStr = matcher.group(1);
        int lineNumber = Integer.parseInt(lineNumberStr);
        if (lineNumber > 0 && !errorLines.contains(lineNumber)) {
          errorLines.add(lineNumber);
        }
      }

      // ✅ Sắp xếp theo thứ tự tăng dần
      errorLines.sort(Integer::compareTo);

    } catch (Exception e) {
      System.err.println("❌ Lỗi khi extract error lines: " + e.getMessage());
    }

    return errorLines;
  }
}