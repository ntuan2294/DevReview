package com.example.service;

import java.io.IOException;
import java.util.*;
import java.util.regex.*;

public class StaticAnalysisService {

    public static class Issue {
        public String type;
        public int line;
        public int col;
        public String code;
        public String message;

        public Issue(String type, int line, int col, String code, String message) {
            this.type = type;
            this.line = line;
            this.col = col;
            this.code = code;
            this.message = message;
        }
    }

    private static final Pattern PYLINT_PATTERN =
        Pattern.compile(".*:(\\d+):(\\d+):\\s*([EW]\\d{4}):\\s*(.*)");
    private static final Pattern MYPY_PATTERN =
        Pattern.compile(".*:(\\d+): (error): (.*)  \\[(.*)\\]");

    public static List<Issue> reviewCode(String language, String code)
            throws IOException, InterruptedException {
        if (!"python".equalsIgnoreCase(language)) {
            return Collections.emptyList();
        }

        List<Issue> issues = new ArrayList<>();

        // 1. Pylint
        List<String> pylintOutput = PythonAnalyzer.runPylint(code);
        System.out.println("=== [PYLINT RAW] ===");
        pylintOutput.forEach(System.out::println);

        for (String line : pylintOutput) {
            Matcher m = PYLINT_PATTERN.matcher(line);
            if (m.matches()) {
                issues.add(new Issue(
                    m.group(3).startsWith("E") ? "ERROR" : "WARNING",
                    Integer.parseInt(m.group(1)),
                    Integer.parseInt(m.group(2)),
                    m.group(3),
                    m.group(4)
                ));
            } else {
                String[] parts = line.split(":");
                if (parts.length >= 4) {
                    try {
                        int lineno = Integer.parseInt(parts[1].trim());
                        int col = Integer.parseInt(parts[2].trim());
                        String codeStr = parts[3].trim().split(" ")[0];
                        String message = line.substring(line.indexOf(parts[3]) + parts[3].length()).trim();
                        issues.add(new Issue(
                            codeStr.startsWith("E") ? "ERROR" : "WARNING",
                            lineno,
                            col,
                            codeStr,
                            message
                        ));
                    } catch (Exception ignored) {}
                }
            }
        }

        // 2. Mypy
        List<String> mypyOutput = PythonAnalyzer.runMypy(code);
        System.out.println("=== [MYPY RAW] ===");
        mypyOutput.forEach(System.out::println);

        for (String line : mypyOutput) {
            Matcher m = MYPY_PATTERN.matcher(line);
            if (m.matches()) {
                issues.add(new Issue(
                    "ERROR",
                    Integer.parseInt(m.group(1)),
                    0,
                    m.group(4),
                    m.group(3)
                ));
            }
        }

        // 3. CrossHair
        List<String> crosshairOutput = PythonAnalyzer.runCrosshair(code);
        System.out.println("=== [CROSSHAIR RAW] ===");
        crosshairOutput.forEach(System.out::println);

        StringBuilder crosshairError = new StringBuilder();
        for (String line : crosshairOutput) {
            if (line.contains("Counterexample")) {
                issues.add(new Issue(
                    "LOGIC",
                    0,
                    0,
                    "CrossHair",
                    line.trim()
                ));
            } else if (line.contains("Traceback") || line.contains("Error") || line.contains("Exception")) {
                crosshairError.append(line).append("\n");
            }
        }
        if (crosshairError.length() > 0) {
            issues.add(new Issue(
                "ERROR",
                0,
                0,
                "CrossHair",
                crosshairError.toString().trim()
            ));
        }

        return issues;
    }
}
