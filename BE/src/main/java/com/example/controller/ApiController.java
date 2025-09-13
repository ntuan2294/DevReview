package com.example.controller;

import com.example.model.User;
import com.example.model.UserRequest;
import com.example.repository.ReviewHistoryRepository;
import com.example.repository.UserRepository;
import com.example.model.ReviewHistory;
import com.example.model.ReviewRequest;
import com.example.service.AIService;
import com.example.service.ExplainService;
import com.example.service.ReviewHistoryService;
import com.example.service.StaticAnalysisService;
import com.example.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.service.SuggestNameService; // ✅ THÊM import này
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ApiController {

    @Autowired
    private UserService userService;

    @Autowired
    private AIService aiService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReviewHistoryService reviewHistoryService;

    @Autowired
    private ReviewHistoryRepository reviewHistoryRepository;

    @Autowired
    private ExplainService explainService;

    @Autowired
    private SuggestNameService suggestNameService; // ✅ THÊM autowired này

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody UserRequest req) {
        Map<String, Object> res = new HashMap<>();
        if (userService.checkLogin(req.getUsername(), req.getPassword())) {
            res.put("success", true);
            res.put("message", "Đăng nhập thành công");
            res.put("user", Map.of("username", req.getUsername()));
        } else {
            res.put("success", false);
            res.put("message", "Sai tài khoản hoặc mật khẩu");
        }
        return res;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody UserRequest req) {
        Map<String, Object> res = new HashMap<>();
        if (userService.isUsernameExists(req.getUsername())) {
            res.put("success", false);
            res.put("message", "Tài khoản đã tồn tại");
        } else {
            userService.register(req.getUsername(), req.getPassword());
            res.put("success", true);
            res.put("message", "Đăng ký thành công");
        }
        return res;
    }

    // @PostMapping("/review")
    // public Map<String, Object> review(@RequestBody ReviewRequest req) {
    //     System.out.println("Language: " + req.getLanguage());
    //     System.out.println("Code: " + req.getCode());
    //     Map<String, Object> result = aiService.reviewCode(req.getLanguage(), req.getCode());
    //     System.out.println("Result: " + result);
    //     return result;
    // }
    @PostMapping("/review")
    public Map<String, Object> review(@RequestBody ReviewRequest req) {
        Map<String, Object> res = new HashMap<>();
        try {
            String feedback = StaticAnalysisService.reviewCode(req.getLanguage(), req.getCode());
            res.put("success", true);
            res.put("feedback", feedback);
        } catch (Exception e) {
            res.put("success", false);
            res.put("error", e.getClass().getSimpleName());
            res.put("message", e.getMessage());
        }
        return res;
    }
    @PostMapping("/explain")
    public Map<String, Object> explain(@RequestBody ReviewRequest req) {
        System.out.println("Language: " + req.getLanguage());
        System.out.println("Code: " + req.getCode());
        Map<String, Object> result = explainService.explainCode(req.getLanguage(), req.getCode());
        System.out.println("Result: " + result);
        return result;
    }

    // ✅ THÊM suggest endpoint
    @PostMapping("/suggest")
    public ResponseEntity<Map<String, Object>> suggestNames(@RequestBody ReviewRequest req) {
        try {
            System.out.println("=== SUGGEST API CALLED ===");
            System.out.println("Language: " + req.getLanguage());
            System.out.println("Code length: " + (req.getCode() != null ? req.getCode().length() : 0));
            System.out.println("User: " + req.getUser());

            // ✅ Validation
            if (req.getCode() == null || req.getCode().trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Code không được để trống");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            if (req.getLanguage() == null || req.getLanguage().trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Language không được để trống");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // ✅ Gọi service
            Map<String, Object> result = suggestNameService.suggestNames(req.getLanguage(), req.getCode());
            System.out.println("Suggest result keys: " + result.keySet());

            // ✅ Đảm bảo có success field
            result.put("success", true);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("❌ Error in suggest endpoint: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Lỗi khi gợi ý tên: " + e.getMessage());
            errorResponse.put("error", e.getClass().getSimpleName());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // ✅ CHỈNH SỬA: Method saveHistory để xử lý error lines
    @PostMapping("/history/save")
    @Transactional
    public ResponseEntity<?> saveHistory(@RequestBody Map<String, Object> payload) {
        try {
            System.out.println("Nhận payload: " + payload);

            User user = null;

            // Thử lấy user bằng userId trước
            if (payload.containsKey("userId")) {
                Long userId = ((Number) payload.get("userId")).longValue();
                user = userRepository.findById(userId).orElse(null);
                System.out.println("Tìm user bằng ID: " + userId + " -> " + (user != null ? "Found" : "Not found"));
            }

            // Nếu không tìm thấy bằng userId, thử tìm bằng username
            if (user == null && payload.containsKey("username")) {
                String username = (String) payload.get("username");
                user = userRepository.findByUsername(username).orElse(null);
                System.out.println(
                        "Tìm user bằng username: " + username + " -> " + (user != null ? "Found" : "Not found"));
            }

            if (user == null) {
                System.err.println("Không tìm thấy user với payload: " + payload);
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Không tìm thấy user"));
            }

            String originalCode = (String) payload.getOrDefault("originalCode", "");
            String reviewSummary = (String) payload.getOrDefault("reviewSummary", "");
            String fixedCode = (String) payload.getOrDefault("fixedCode", "");

            // ✅ XỬ LÝ LANGUAGE CHÍNH XÁC HƠN
            String language = "unknown";
            if (payload.containsKey("language")) {
                Object langObj = payload.get("language");
                if (langObj != null) {
                    String langStr = langObj.toString().trim();
                    if (!langStr.isEmpty() && !langStr.equals("undefined") && !langStr.equals("null")) {
                        language = langStr.toLowerCase();
                    }
                }
            }

            // ✅ THÊM: Xử lý error lines
            String errorLinesJson = null;
            if (payload.containsKey("errorLines")) {
                Object errorLinesObj = payload.get("errorLines");
                if (errorLinesObj != null) {
                    // Convert List<Integer> thành JSON string
                    if (errorLinesObj instanceof List) {
                        try {
                            ObjectMapper mapper = new ObjectMapper();
                            errorLinesJson = mapper.writeValueAsString(errorLinesObj);
                            System.out.println("✅ Error lines JSON: " + errorLinesJson);
                        } catch (Exception e) {
                            System.err.println("❌ Lỗi convert error lines: " + e.getMessage());
                        }
                    } else if (errorLinesObj instanceof String) {
                        errorLinesJson = (String) errorLinesObj;
                    }
                }
            }

            System.out.println("Đang lưu cho user: " + user.getUsername() + " (ID: " + user.getId() + ")");
            System.out.println("FINAL Language: '" + language + "'");
            System.out.println("Error lines: " + errorLinesJson);

            // ✅ GỌI SERVICE VỚI ERROR LINES
            ReviewHistory savedHistory = reviewHistoryService.saveHistory(user, originalCode, reviewSummary, fixedCode,
                    language, errorLinesJson);
            System.out.println("✅ Lưu thành công với ID: " + savedHistory.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đã lưu thành công");
            response.put("historyId", savedHistory.getId());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Lỗi khi lưu lịch sử: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Lỗi khi lưu lịch sử: " + e.getMessage());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // ✅ CẬP NHẬT: Các method get history để include error lines
    @GetMapping("/history/{username}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getHistoryByUsername(@PathVariable String username) {
        try {
            System.out.println("Đang lấy lịch sử cho user: " + username);

            List<ReviewHistory> history = reviewHistoryService.getHistory(username);
            System.out.println("Tìm thấy " + history.size() + " records cho user: " + username);

            // ✅ MANUAL SERIALIZE với error lines
            List<Map<String, Object>> response = history.stream().map(h -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", h.getId());
                item.put("originalCode", h.getOriginalCode());
                item.put("reviewSummary", h.getReviewSummary());
                item.put("fixedCode", h.getFixedCode());
                item.put("language", h.getLanguage());
                item.put("errorLines", h.getErrorLines()); // ✅ THÊM error lines
                item.put("createdAt", h.getCreatedAt());

                if (h.getUser() != null) {
                    item.put("user", Map.of(
                            "id", h.getUser().getId(),
                            "username", h.getUser().getUsername()));
                }

                return item;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy lịch sử cho user " + username + ": " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Lỗi khi lấy lịch sử: " + e.getMessage());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // ✅ CẬP NHẬT: Get history detail với error lines
    @GetMapping("/history/detail/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getHistoryDetail(@PathVariable Long id) {
        try {
            System.out.println("Đang lấy chi tiết lịch sử ID: " + id);

            return reviewHistoryRepository.findById(id)
                    .map(history -> {
                        System.out
                                .println("Tìm thấy lịch sử ID " + id + " cho user: " + history.getUser().getUsername());

                        // ✅ MANUAL SERIALIZE với error lines
                        Map<String, Object> response = new HashMap<>();
                        response.put("id", history.getId());
                        response.put("originalCode", history.getOriginalCode());
                        response.put("reviewSummary", history.getReviewSummary());
                        response.put("fixedCode", history.getFixedCode());
                        response.put("language", history.getLanguage());
                        response.put("errorLines", history.getErrorLines()); // ✅ THÊM error lines
                        response.put("createdAt", history.getCreatedAt());

                        if (history.getUser() != null) {
                            response.put("user", Map.of(
                                    "id", history.getUser().getId(),
                                    "username", history.getUser().getUsername()));
                        }

                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        System.out.println("Không tìm thấy lịch sử với ID: " + id);
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy chi tiết lịch sử ID " + id + ": " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Lỗi khi lấy chi tiết lịch sử: " + e.getMessage());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/user/{username}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        try {
            System.out.println("Đang tìm user với username: " + username);

            return userRepository.findByUsername(username)
                    .map(user -> {
                        System.out.println("Tìm thấy user: " + username + " với ID: " + user.getId());

                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("id", user.getId());
                        response.put("username", user.getUsername());

                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        System.out.println("Không tìm thấy user với username: " + username);

                        Map<String, Object> errorResponse = new HashMap<>();
                        errorResponse.put("success", false);
                        errorResponse.put("message", "Không tìm thấy user với username: " + username);

                        return ResponseEntity.status(404).body(errorResponse);
                    });
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy thông tin user " + username + ": " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Lỗi server: " + e.getMessage());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @DeleteMapping("/history/{id}")
    @Transactional
    public ResponseEntity<?> deleteHistory(@PathVariable Long id, @RequestParam String username) {
        try {
            return reviewHistoryRepository.findById(id)
                    .map(history -> {
                        if (!history.getUser().getUsername().equals(username)) {
                            Map<String, Object> errorResponse = new HashMap<>();
                            errorResponse.put("success", false);
                            errorResponse.put("message", "Không có quyền xóa lịch sử này");
                            return ResponseEntity.status(403).body(errorResponse);
                        }

                        reviewHistoryRepository.delete(history);

                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("message", "Đã xóa lịch sử thành công");

                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        Map<String, Object> errorResponse = new HashMap<>();
                        errorResponse.put("success", false);
                        errorResponse.put("message", "Không tìm thấy lịch sử với ID: " + id);

                        return ResponseEntity.status(404).body(errorResponse);
                    });
        } catch (Exception e) {
            System.err.println("Lỗi khi xóa lịch sử: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Lỗi khi xóa lịch sử: " + e.getMessage());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // ✅ THÊM ENDPOINT DEBUG
    @GetMapping("/debug/history/{username}")
    public ResponseEntity<?> debugHistory(@PathVariable String username) {
        try {
            // 1. Check user exists
            java.util.Optional<User> userOpt = userRepository.findByUsername(username);
            if (!userOpt.isPresent()) {
                return ResponseEntity.ok(Map.of("error", "User not found", "username", username));
            }

            User user = userOpt.get();

            // 2. Get history directly
            List<ReviewHistory> history = reviewHistoryRepository.findByUser_Username(username);

            // 3. Create simple response without circular reference
            List<Map<String, Object>> simplified = history.stream().map(h -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", h.getId());
                item.put("language", h.getLanguage());
                item.put("createdAt", h.getCreatedAt());
                item.put("hasOriginalCode", h.getOriginalCode() != null);
                item.put("hasReviewSummary", h.getReviewSummary() != null);
                item.put("originalCodeLength", h.getOriginalCode() != null ? h.getOriginalCode().length() : 0);
                return item;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "username", username,
                    "userId", user.getId(),
                    "historyCount", history.size(),
                    "histories", simplified));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(Map.of("error", e.getMessage()));
        }
    }
}