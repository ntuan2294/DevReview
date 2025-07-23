package main.java.com.example;

import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;

public class GeminiDemo {
  public static void main(String[] args) throws Exception {
    String apiKey = "AIzaSyAMU4ChLP876TnowgNxEXy6EfkAK7Q1YKU"; // Thay bằng API key thực tế
    String prompt = "Viết hàm kiểm tra số nguyên tố trong Java";

    String requestBody = """
        {
          "contents": [
            {
              "parts": [
                { "text": "%s" }
              ]
            }
          ]
        }
        """.formatted(prompt);

    // Đúng endpoint mới của Gemini v1:
    String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="
        + apiKey;

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(endpoint))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
        .build();

    HttpClient client = HttpClient.newHttpClient();
    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

    System.out.println("Phản hồi từ Gemini:");
    System.out.println(response.body());
  }
}
