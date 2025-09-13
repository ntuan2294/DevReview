package com.example.service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.springframework.stereotype.Service;

@Service
public class AIService {

    public static String reviewCode(String language, String code) {
        try {
            // tạo file tạm theo ngôn ngữ
            String extension = getExtension(language);
            if (extension == null) {
                return "Ngôn ngữ chưa được hỗ trợ: " + language;
            }

            Path tempFile = Files.createTempFile("review_" + UUID.randomUUID(), extension);
            Files.writeString(tempFile, code);

            // chọn lệnh cho từng ngôn ngữ
            String[] command = getCommand(language, tempFile.toAbsolutePath().toString());

            if (command == null) {
                return "Chưa cấu hình tool cho ngôn ngữ: " + language;
            }

            // chạy tool
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // đọc output
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
            int exitCode = process.waitFor();

            if (output.length() == 0) {
                return "Tool không trả về kết quả (exitCode=" + exitCode + ")";
            }

            return output.toString();

        } catch (Exception e) {
            return "Lỗi khi phân tích code: " + e.getMessage();
        }
    }

    private static String getExtension(String language) {
        switch (language.toLowerCase()) {
            case "python": return ".py";
            case "javascript": return ".js";
            case "java": return ".java";
            case "cpp": return ".cpp";
            case "csharp": return ".cs";
            case "php": return ".php";
            case "ruby": return ".rb";
            case "go": return ".go";
            default: return null;
        }
    }

    private static String[] getCommand(String language, String filePath) {
        switch (language.toLowerCase()) {
            case "python":
                return new String[]{"pylint", "--disable=R,C", filePath};
            case "javascript":
                return new String[]{"eslint", filePath};
            case "java":
                // cần file config checkstyle.xml trong project
                return new String[]{"java", "-jar", "/opt/checkstyle.jar", "-c", "/google_checks.xml", filePath};
            case "cpp":
                return new String[]{"cppcheck", "--enable=all", "--std=c++17", filePath};
            case "csharp":
                // giả định đã cài dotnet format / roslyn analyzers
                return new String[]{"dotnet", "format", filePath};
            case "php":
                return new String[]{"php", "-l", filePath};
            case "ruby":
                return new String[]{"rubocop", filePath};
            case "go":
                return new String[]{"golint", filePath};
            default:
                return null;
        }
    }
}
