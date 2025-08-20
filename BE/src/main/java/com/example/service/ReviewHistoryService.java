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

    public ReviewHistory saveHistory(User user, String originalCode, String reviewSummary, String fixedCode) {
        ReviewHistory history = new ReviewHistory();
        history.setUser(user);
        history.setOriginalCode(originalCode);
        history.setReviewSummary(reviewSummary);
        history.setFixedCode(fixedCode);
        return reviewHistoryRepository.save(history);
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

    // ✅ THÊM: Method tạo summary ngắn gọn từ reviewSummary
    public String createShortSummary(String fullSummary) {
        if (fullSummary == null || fullSummary.trim().isEmpty()) {
            return "Review không có tóm tắt";
        }

        String cleaned = fullSummary
                .replaceAll("[#*`]", "") // Loại bỏ markdown
                .replaceAll("\\n+", " ") // Thay newlines bằng space
                .trim();

        // Lấy câu đầu tiên
        String[] sentences = cleaned.split("[.!?]+");
        if (sentences.length > 0 && sentences[0].trim().length() > 10) {
            String firstSentence = sentences[0].trim();
            return firstSentence.length() > 80
                    ? firstSentence.substring(0, 77) + "..."
                    : firstSentence;
        }

        // Fallback: lấy 80 ký tự đầu
        return cleaned.length() > 80
                ? cleaned.substring(0, 77) + "..."
                : cleaned;
    }

    public ReviewHistory saveHistory(User user, String originalCode, String reviewSummary, String fixedCode,
            String language) {
        ReviewHistory history = new ReviewHistory();
        history.setUser(user);
        history.setOriginalCode(originalCode);
        history.setReviewSummary(reviewSummary);
        history.setFixedCode(fixedCode);
        history.setLanguage(language); // Thêm dòng này
        return reviewHistoryRepository.save(history);
    }

    // Method để tạo display name theo yêu cầu
    public String createHistoryDisplayName(ReviewHistory history) {
        String language = history.getLanguage() != null ? history.getLanguage().toUpperCase() : "UNKNOWN";
        return String.format("Review %s Code #%d", language, history.getId());
    }
}