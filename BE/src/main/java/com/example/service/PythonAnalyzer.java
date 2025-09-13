package com.example.service;

import java.io.*;
import java.util.*;

public class PythonAnalyzer {

    private static List<String> runTool(String tool, String... args) throws IOException, InterruptedException {
        // Tạo file tạm
        File tempFile = File.createTempFile("analyze-", ".py");
        try (FileWriter fw = new FileWriter(tempFile)) {
            fw.write(args[0]); // code Python truyền vào
        }

        List<String> command = new ArrayList<>();
        command.add(tool);

        // Thêm tham số theo từng tool
        if ("pylint".equals(tool)) {
            command.add("--disable=all");
            command.add("--enable=E,W");
            command.add("--output-format=text");
        } else if ("mypy".equals(tool)) {
            command.add("--ignore-missing-imports");
            command.add("--show-error-codes");
        } else if ("crosshair".equals(tool)) {
            command.add("check");
        }

        command.add(tempFile.getAbsolutePath());

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        List<String> output = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = br.readLine()) != null) {
                output.add(line);
            }
        }
        process.waitFor();
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
