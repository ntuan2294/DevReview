package com.example.service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class PythonAnalyzer {

    private static List<String> runTool(String tool, String code) throws IOException, InterruptedException {
        // Tạo file tạm
        File tempFile = File.createTempFile("analyze-", ".py");
        try (Writer fw = new OutputStreamWriter(new FileOutputStream(tempFile), StandardCharsets.UTF_8)) {
            fw.write(code);
        }

        List<String> command = new ArrayList<>();
        if ("pylint".equals(tool)) {
            command = Arrays.asList(
                "pylint",
                "--disable=all",
                "--enable=E,W",
                "--output-format=text",
                tempFile.getAbsolutePath()
            );
        } else if ("mypy".equals(tool)) {
            command = Arrays.asList(
                "mypy",
                "--ignore-missing-imports",
                "--show-error-codes",
                tempFile.getAbsolutePath()
            );
        } else if ("crosshair".equals(tool)) {
            command = Arrays.asList(
                "crosshair",
                "check",
                tempFile.getAbsolutePath()
            );
        } else {
            throw new IllegalArgumentException("Unsupported tool: " + tool);
        }

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);

        // ✅ Fix encoding lỗi Unicode trên Windows
        pb.environment().put("PYTHONUTF8", "1");

        Process process = pb.start();

        List<String> output = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                System.out.println("[" + tool.toUpperCase() + " OUTPUT] " + line);
                output.add(line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0 && output.isEmpty()) {
            System.err.println("[" + tool.toUpperCase() + "] exited with code " + exitCode);
        }

        tempFile.delete();
        return output;
    }

    public static List<String> runPylint(String code) throws IOException, InterruptedException {
        return runTool("pylint", code);
    }

    public static List<String> runMypy(String code) throws IOException, InterruptedException {
        return runTool("mypy", code);
    }

    public static List<String> runCrosshair(String code) throws IOException, InterruptedException {
        return runTool("crosshair", code);
    }
}
