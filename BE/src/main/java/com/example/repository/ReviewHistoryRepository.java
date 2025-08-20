package com.example.repository;

import com.example.model.ReviewHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewHistoryRepository extends JpaRepository<ReviewHistory, Long> {
    // lấy lịch sử theo username
    List<ReviewHistory> findByUsername(String username);
}
