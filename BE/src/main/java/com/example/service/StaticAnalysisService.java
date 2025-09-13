package com.example.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class StaticAnalysisService {

    public static String reviewCode(String language, String code) throws IOException, InterruptedException {
        Path tempFile = Files.createTempFile("code", getExtension(language));
        Files.writeString(tempFile, code);

        String command = getCommand(language, tempFile.toString());

        Process process = Runtime.getRuntime().exec(command);
        int exitCode = process.waitFor();

        String output = new String(process.getInputStream().readAllBytes());
        String error = new String(process.getErrorStream().readAllBytes());

        if (exitCode != 0) {
            return "Lỗi khi phân tích code:\n" + error;
        }

        return output.isEmpty() ? "Không có lỗi được phát hiện." : output;
    }

    private static String getExtension(String language) {
        return switch (language.toLowerCase()) {
            case "java" -> ".java";
            case "python" -> ".py";
            case "cpp", "c++" -> ".cpp";
            default -> ".txt";
        };
    }

    private static String getCommand(String language, String filePath) {
        return switch (language.toLowerCase()) {
            case "java" -> "checkstyle -c /google_checks.xml " + filePath;
            case "python" -> "pylint " + filePath;
            case "cpp", "c++" -> "cppcheck " + filePath;
            default -> "echo 'Ngôn ngữ không được hỗ trợ'";
        };
    }
}
