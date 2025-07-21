package com.example.service;

public class AIService {
    public String mockReview(String language, String code) {
        return "Phát hiện đoạn code bằng " + language.toUpperCase() + " có " +
                code.split("\n").length + " dòng.\n"
                + "- Gợi ý: Hãy thêm comment cho các hàm.\n"
                + "- Gợi ý: Kiểm tra biến chưa sử dụng.";
    }
}
