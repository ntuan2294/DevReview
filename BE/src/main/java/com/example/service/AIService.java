package com.example.service;

import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;

import com.google.gson.*;

public class AIService {

  private static final String API_KEY = "AIzaSyAMU4ChLP876TnowgNxEXy6EfkAK7Q1YKU"; // ❗️Thay bằng key thật
  private static final String MODEL = "gemini-2.0-flash";
  private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

  public static String reviewCode(String language, String codeSnippet) {
    try {
      // ✅ Tạo prompt đánh giá mã nguồn đã được chỉnh sửa
      String prompt = String.format(
          """
              Bạn là một chuyên gia đánh giá chất lượng mã nguồn. Hãy phân tích đoạn mã %s sau đây và thực hiện các yêu cầu sau theo đúng định dạng:

              **1. Phát hiện và liệt kê lỗi logic:**
              (Liệt kê tất cả lỗi logic nếu có, kèm theo giải thích rõ ràng. Nếu không có lỗi thì ghi "Không có lỗi logic.")

              **2. Cảnh báo về các vấn đề phong cách lập trình:**
              (Chỉ ra các vấn đề về định dạng mã và phong cách theo chuẩn của ngôn ngữ. Nếu không có vấn đề thì ghi "Không có vấn đề về phong cách.")

              **3. Gợi ý cải thiện:**
              (Đưa ra các gợi ý để cải thiện hiệu suất, khả năng đọc hiểu và bảo trì của đoạn mã.)

              **4. Mã đã được chỉnh sửa:**
              ```%s
              [Viết lại đoạn mã đã được cải thiện tại đây]
              ```

              Đây là đoạn mã cần phân tích:

              %s
              """,
          language, language, codeSnippet);

      // ✅ Tạo JSON body bằng Gson
      JsonObject textPart = new JsonObject();
      textPart.addProperty("text", prompt);

      JsonArray parts = new JsonArray();
      parts.add(textPart);

      JsonObject content = new JsonObject();
      content.add("parts", parts);

      JsonArray contents = new JsonArray();
      contents.add(content);

      JsonObject requestBodyJson = new JsonObject();
      requestBodyJson.add("contents", contents);

      String requestBody = requestBodyJson.toString();

      String url = BASE_URL + MODEL + ":generateContent?key=" + API_KEY;

      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(url))
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
          .build();

      HttpClient client = HttpClient.newHttpClient();
      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

      // ✅ In response HTTP status và body nếu cần
      int statusCode = response.statusCode();
      String body = response.body();

      if (statusCode != 200) {
        return "❌ Lỗi HTTP " + statusCode + ": \n" + body;
      }

      // ✅ Parse JSON để lấy nội dung văn bản
      JsonObject json = JsonParser.parseString(body).getAsJsonObject();
      JsonArray candidates = json.getAsJsonArray("candidates");

      if (candidates != null && !candidates.isEmpty()) {
        JsonObject contentObj = candidates.get(0).getAsJsonObject().getAsJsonObject("content");
        JsonArray partsArr = contentObj.getAsJsonArray("parts");

        if (partsArr != null && !partsArr.isEmpty()) {
          String reply = partsArr.get(0).getAsJsonObject().get("text").getAsString();
          // Loại bỏ header không cần thiết và chỉ trả về nội dung chính
          return reply.trim();
        }
      }

      return "⚠️ Không tìm thấy nội dung phản hồi từ Gemini.";

    } catch (Exception e) {
      return "❗️Lỗi khi gọi Gemini API: " + e.getMessage();
    }
  }
}