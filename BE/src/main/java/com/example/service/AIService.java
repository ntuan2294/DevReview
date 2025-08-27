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
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.List;
import java.util.ArrayList;

// ✅ FIXED AIService.java - Remove empty lines and improve error detection
@Service
public class AIService {

  private static final String API_KEY = "AIzaSyAcfZKJCZpQZZIA7sVjHl-ss5apA8J083Y";
  private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
  private static final String MODEL = "gemini-2.0-flash";
  private static final String GENERATE_CONTENT_ENDPOINT = ":generateContent?key=";
  private static final String CONTENT_TYPE = "application/json";
  private static final int HTTP_OK = 200;

  // ✅ ENHANCED: Multiple regex patterns for better error line detection
  private static final Pattern[] ERROR_LINE_PATTERNS = {
      Pattern.compile("(?:dòng|line)\\s*(\\d+)(?:\\s*[:-]\\s*\\d+)?", Pattern.CASE_INSENSITIVE),
      Pattern.compile("(?:lỗi tại dòng|error at line|error on line)\\s*(\\d+)", Pattern.CASE_INSENSITIVE),
      Pattern.compile("(?:syntax error.*line)\\s*(\\d+)", Pattern.CASE_INSENSITIVE),
      Pattern.compile("(?:\\bL)(\\d+)(?::)", Pattern.CASE_INSENSITIVE), // L15: format
      Pattern.compile("(?:tại vị trí|at position).*?(\\d+)", Pattern.CASE_INSENSITIVE)
  };

  private static final Pattern CODE_PATTERN = Pattern.compile(
      "```\\s*([a-zA-Z0-9]*)?\\s*\\n?([\\s\\S]*?)```",
      Pattern.MULTILINE);

  public Map<String, Object> reviewCode(String language, String codeSnippet) {
    Map<String, Object> result = new HashMap<>();

    try {
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
        result.put("feedback", "❌ Lỗi HTTP " + response.statusCode() + ": " + response.body());
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

  private String addLineNumbers(String code) {
    String[] lines = code.split("\n");
    StringBuilder numberedCode = new StringBuilder();

    for (int i = 0; i < lines.length; i++) {
      numberedCode.append(String.format("%d: %s\n", i + 1, lines[i]));
    }

    return numberedCode.toString();
  }

  // ✅ ENHANCED: Better prompt for error detection
  private String buildEnhancedPrompt(String language, String numberedCode) {
    return String.format(
        "Bạn là chuyên gia đánh giá mã nguồn %s. Phân tích code sau và trả lời CHÍNH XÁC theo format:\n\n" +
            "**QUAN TRỌNG - YÊU CẦU FORMAT:**\n" +
            "1. **Lỗi phát hiện:**\n" +
            "   - Dòng X: [mô tả lỗi cụ thể]\n" +
            "   - Dòng Y: [mô tả lỗi cụ thể]\n" +
            "   (Nếu KHÔNG có lỗi thì viết: 'Không phát hiện lỗi logic hoặc cú pháp')\n\n" +
            "2. **Cải thiện code:**\n" +
            "   - [Gợi ý cải thiện 1]\n" +
            "   - [Gợi ý cải thiện 2]\n\n" +
            "3. **Code đã tối ưu:**\n" +
            "```%s\n[code đã được cải thiện]\n```\n\n" +
            "**LưU Ý:**\n" +
            "- LUÔN chỉ rõ SỐ DÒNG khi có lỗi: 'Dòng 5: lỗi cú pháp'\n" +
            "- KHÔNG để dòng trống trong response\n" +
            "- PHẢI có code cải thiện trong code block\n\n" +
            "**Code cần phân tích:**\n%s",
        language.toUpperCase(),
        language.toLowerCase(),
        numberedCode);
  }

  private String createRequestBody(String prompt) {
    return String.format(
        "{ \"contents\": [ { \"parts\": [ { \"text\": \"%s\" } ] } ] }",
        prompt.replace("\n", "\\n").replace("\"", "\\\""));
  }

  // ✅ ENHANCED: Better response parsing and error line extraction
  private Map<String, Object> parseEnhancedGeminiResponse(String originalCode, String body) throws IOException {
    Map<String, Object> result = new HashMap<>();
    ObjectMapper mapper = new ObjectMapper();
    JsonNode root = mapper.readTree(body);

    if (!root.has("candidates")) {
      result.put("feedback", "⚠ Không nhận được phản hồi từ Gemini.");
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

    String allText = fullText.toString().trim();

    // ✅ CLEAN TEXT: Remove excessive empty lines
    String cleanedText = allText
        .replaceAll("\n\\s*\n\\s*\n+", "\n\n") // Multiple empty lines -> double
        .replaceAll("(?m)^\\s*$\n", "") // Remove empty lines
        .trim();

    // Extract improved code
    Matcher matcher = CODE_PATTERN.matcher(cleanedText);
    String improvedCode = "";
    if (matcher.find()) {
      improvedCode = matcher.group(2).trim();
      // Clean improved code
      improvedCode = improvedCode.replaceAll("\n\\s*\n+", "\n").trim();
    }

    // ✅ ENHANCED: Better error line extraction
    List<Integer> errorLines = extractErrorLines(cleanedText);

    // Clean feedback by removing code blocks
    String feedbackWithoutCode = cleanedText
        .replaceAll("```[a-zA-Z0-9]*\\s*\\n[\\s\\S]*?```", "")
        .replaceAll("\n\\s*\n+", "\n")
        .trim();

    // Generate summary
    String[] sentences = feedbackWithoutCode.split("\\. ");
    String summary = sentences.length > 2
        ? String.join(". ", sentences[0], sentences[1]) + "."
        : feedbackWithoutCode;

    result.put("originalCode", originalCode);
    result.put("feedback", feedbackWithoutCode);
    result.put("improvedCode", improvedCode.isEmpty() ? "⚠ Không tìm thấy code đã sửa." : improvedCode);
    result.put("summary", summary);
    result.put("errorLines", errorLines);

    System.out.println("📍 Error lines detected: " + errorLines);
    System.out.println("📝 Cleaned feedback length: " + feedbackWithoutCode.length());

    return result;
  }

  // ✅ ENHANCED: Multiple pattern matching for error line extraction
  private List<Integer> extractErrorLines(String feedback) {
    List<Integer> errorLines = new ArrayList<>();
    Set<Integer> uniqueLines = new HashSet<>();

    try {
      // Try all patterns
      for (Pattern pattern : ERROR_LINE_PATTERNS) {
        Matcher matcher = pattern.matcher(feedback);
        while (matcher.find()) {
          String lineNumberStr = matcher.group(1);
          int lineNumber = Integer.parseInt(lineNumberStr);
          if (lineNumber > 0 && uniqueLines.add(lineNumber)) {
            errorLines.add(lineNumber);
          }
        }
      }

      // Sort ascending
      errorLines.sort(Integer::compareTo);

      // ✅ FALLBACK: If no errors found but feedback suggests issues,
      // try to infer from common error keywords
      if (errorLines.isEmpty() && containsErrorIndicators(feedback)) {
        System.out.println("⚠️ No specific line numbers found, but errors detected in feedback");
      }

    } catch (Exception e) {
      System.err.println("❌ Lỗi khi extract error lines: " + e.getMessage());
    }

    return errorLines;
  }

  // ✅ NEW: Check if feedback contains error indicators
  private boolean containsErrorIndicators(String feedback) {
    String[] errorKeywords = {
        "lỗi", "error", "syntax", "bug", "sai", "thiếu", "missing",
        "invalid", "undefined", "null", "exception"
    };

    String lowerFeedback = feedback.toLowerCase();
    for (String keyword : errorKeywords) {
      if (lowerFeedback.contains(keyword)) {
        return true;
      }
    }
    return false;
  }
}