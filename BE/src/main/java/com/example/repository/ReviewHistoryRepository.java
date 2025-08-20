package com.example.repository;

import com.example.model.ReviewHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewHistoryRepository extends JpaRepository<ReviewHistory, Long> {
    // ✅ Sửa: sử dụng nested property để tìm theo username của User
    List<ReviewHistory> findByUser_Username(String username);
}