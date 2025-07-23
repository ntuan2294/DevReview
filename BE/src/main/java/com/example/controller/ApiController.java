package com.example.controller;

import com.example.model.UserRequest;
import com.example.model.ReviewRequest;
import com.example.service.AIService;
import com.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ApiController {

    @Autowired
    private UserService userService;

    private final AIService aiService = new AIService();

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
        Map<String, Object> res = new HashMap<>();
        String feedback = aiService.mockReview(req.getLanguage(), req.getCode());
        res.put("feedback", feedback);
        return res;
    }
}
