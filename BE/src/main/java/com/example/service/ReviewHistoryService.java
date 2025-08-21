package com.example.service;

import com.example.model.ReviewHistory;
import com.example.model.User;
import com.example.repository.ReviewHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Comparator;

@Service
public class ReviewHistoryService {

    @Autowired
    private ReviewHistoryRepository reviewHistoryRepository;

    // ✅ Method cũ - giữ cho backward compatibility (không có language)
    public ReviewHistory saveHistory(User user, String originalCode, String reviewSummary, String fixedCode) {
        return saveHistory(user, originalCode, reviewSummary, fixedCode, "unknown");
    }

    // Trong ReviewHistoryService.java

    public ReviewHistory saveHistory(User user, String originalCode, String reviewSummary, String fixedCode,
            String language) {
        System.out.println("=== SAVE HISTORY DEBUG ===");
        System.out.println("User: " + user.getUsername());
        System.out.println("Language parameter: '" + language + "'");

        ReviewHistory history = new ReviewHistory();
        history.setUser(user);
        history.setOriginalCode(originalCode);
        history.setReviewSummary(reviewSummary);
        history.setFixedCode(fixedCode);

        // ✅ FORCE SET LANGUAGE
        String finalLanguage = (language != null && !language.trim().isEmpty()) ? language.trim() : "unknown";
        history.setLanguage(finalLanguage);

        System.out.println("Before save - Language set to: '" + history.getLanguage() + "'");

        ReviewHistory saved = reviewHistoryRepository.save(history);

        System.out.println("After save - Saved ID: " + saved.getId());
        System.out.println("After save - Language in entity: '" + saved.getLanguage() + "'");

        // ✅ VERIFY BẰNG DATABASE QUERY
        ReviewHistory verified = reviewHistoryRepository.findById(saved.getId()).orElse(null);
        if (verified != null) {
            System.out.println("Verified from DB - Language: '" + verified.getLanguage() + "'");
        }

        return saved;
    }

    // ✅ Cải thiện: sắp xếp lịch sử theo thời gian mới nhất trước
    public List<ReviewHistory> getHistory(String username) {
        List<ReviewHistory> histories = reviewHistoryRepository.findByUser_Username(username);

        // Sắp xếp theo createdAt giảm dần (mới nhất trước)
        histories.sort(Comparator.comparing(ReviewHistory::getCreatedAt).reversed());

        System.out.println("Đã sắp xếp " + histories.size() + " lịch sử review cho user: " + username);

        return histories;
    }

    // ✅ THÊM: Method lấy lịch sử với phân trang
    public List<ReviewHistory> getHistoryWithLimit(String username, int limit) {
        List<ReviewHistory> allHistories = getHistory(username);

        // Trả về tối đa `limit` records
        return allHistories.stream()
                .limit(limit)
                .toList();
    }

    // ✅ THÊM: Method đếm tổng số lịch sử
    public long countHistoryByUsername(String username) {
        return reviewHistoryRepository.findByUser_Username(username).size();
    }

    // ✅ THÊM: Method xóa lịch sử cũ (giữ lại N records mới nhất)
    public void cleanupOldHistory(String username, int keepLatest) {
        List<ReviewHistory> histories = getHistory(username);

        if (histories.size() > keepLatest) {
            List<ReviewHistory> toDelete = histories.subList(keepLatest, histories.size());
            reviewHistoryRepository.deleteAll(toDelete);
            System.out.println("Đã xóa " + toDelete.size() + " lịch sử cũ cho user: " + username);
        }
    }

    // Method để tạo display name theo yêu cầu
    public String createHistoryDisplayName(ReviewHistory history) {
        String language = history.getLanguage() != null ? history.getLanguage().toUpperCase() : "UNKNOWN";
        return String.format("Review %s Code #%d", language, history.getId());
    }
}