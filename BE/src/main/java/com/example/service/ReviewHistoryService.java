package com.example.service;

import com.example.model.ReviewHistory;
import com.example.model.User;
import com.example.repository.ReviewHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

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

    public List<ReviewHistory> getHistory(String username) {
        // dùng nested property
        return reviewHistoryRepository.findByUser_Username(username);
    }

}
