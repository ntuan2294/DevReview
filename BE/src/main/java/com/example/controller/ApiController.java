package com.example.controller;

import com.example.model.User;
import com.example.model.UserRequest;
import com.example.repository.ReviewHistoryRepository;
import com.example.repository.UserRepository;
import com.example.model.ReviewHistory;
import com.example.model.ReviewRequest;
import com.example.service.AIService;
import com.example.service.ReviewHistoryService;
import com.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

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

    @PostMapping("/review")
    public Map<String, Object> review(@RequestBody ReviewRequest req) {
        System.out.println("Language: " + req.getLanguage());
        System.out.println("Code: " + req.getCode());
        Map<String, Object> result = aiService.reviewCode(req.getLanguage(), req.getCode());
        System.out.println("Result: " + result);
        return result;
    }

    @PostMapping("/history/save")
    public ResponseEntity<?> saveHistory(@RequestBody Map<String, Object> payload) {
        try {
            System.out.println("Nhận payload: " + payload);

            User user = null;

            // Thử lấy user bằng userId trước
            if (payload.containsKey("userId")) {
                Long userId = ((Number) payload.get("userId")).longValue();
                user = userRepository.findById(userId)
                        .orElse(null);
                System.out.println("Tìm user bằng ID: " + userId + " -> " + (user != null ? "Found" : "Not found"));
            }

            // Nếu không tìm thấy bằng userId, thử tìm bằng username
            if (user == null && payload.containsKey("username")) {
                String username = (String) payload.get("username");
                user = userRepository.findByUsername(username)
                        .orElse(null);
                System.out.println(
                        "Tìm user bằng username: " + username + " -> " + (user != null ? "Found" : "Not found"));
            }

            if (user == null) {
                System.err.println("Không tìm thấy user với payload: " + payload);
                return ResponseEntity.badRequest().body("Không tìm thấy user");
            }

            String originalCode = (String) payload.getOrDefault("originalCode", "");
            String reviewSummary = (String) payload.getOrDefault("reviewSummary", "");
            String fixedCode = (String) payload.getOrDefault("fixedCode", "");

            System.out.println("Đang lưu cho user: " + user.getUsername() + " (ID: " + user.getId() + ")");
            System.out.println("Original code length: " + originalCode.length());
            System.out.println("Review summary length: " + reviewSummary.length());
            System.out.println("Fixed code length: " + fixedCode.length());

            ReviewHistory savedHistory = reviewHistoryService.saveHistory(user, originalCode, reviewSummary, fixedCode);
            System.out.println("Lưu thành công với ID: " + savedHistory.getId());

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

    // Thêm endpoint này vào ApiController.java
    @GetMapping("/user/{username}")
    public ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        try {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(404).body("User not found");
        }
    }

    @Autowired
    private ReviewHistoryRepository reviewHistoryRepository;

    @GetMapping("/history/detail/{id}")
    public ReviewHistory getHistoryDetail(@PathVariable Long id) {
        return reviewHistoryRepository.findById(id).orElse(null); // ✅ đúng
    }

    @GetMapping("/history/item/{id}")
    public ResponseEntity<ReviewHistory> getHistoryItem(@PathVariable Long id) {
        return reviewHistoryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

}
