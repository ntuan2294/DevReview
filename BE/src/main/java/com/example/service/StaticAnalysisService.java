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
        Pattern.compile(".*:(\\d+):(\\d+): ([EW]\\d{4}): (.*)");
    private static final Pattern MYPY_PATTERN =
        Pattern.compile(".*:(\\d+): (error): (.*)  \\[(.*)\\]");

    public static List<Issue> reviewCode(String language, String code)
            throws IOException, InterruptedException {
        if (!"python".equalsIgnoreCase(language)) {
            return Collections.emptyList();
        }

        List<Issue> issues = new ArrayList<>();

        // 1. Pylint
        for (String line : PythonAnalyzer.runPylint(code)) {
            Matcher m = PYLINT_PATTERN.matcher(line);
            if (m.matches()) {
                issues.add(new Issue(
                    m.group(3).startsWith("E") ? "ERROR" : "WARNING",
                    Integer.parseInt(m.group(1)),
                    Integer.parseInt(m.group(2)),
                    m.group(3),
                    m.group(4)
                ));
            }
        }

        // 2. Mypy
        for (String line : PythonAnalyzer.runMypy(code)) {
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
        for (String line : PythonAnalyzer.runCrosshair(code)) {
            if (line.contains("Counterexample")) {
                issues.add(new Issue(
                    "LOGIC",
                    0,
                    0,
                    "CrossHair",
                    line.trim()
                ));
            }
        }

        return issues;
    }
}
