package com.example.repository;

import com.example.model.ReviewHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Repository
public interface ReviewHistoryRepository extends JpaRepository<ReviewHistory, Long> {

    // ✅ Query cơ bản tìm theo username
    List<ReviewHistory> findByUser_Username(String username);

    // ✅ THÊM: Query với sắp xếp theo thời gian mới nhất trước
    List<ReviewHistory> findByUser_UsernameOrderByCreatedAtDesc(String username);

    // ✅ THÊM: Query với phân trang
    List<ReviewHistory> findByUser_UsernameOrderByCreatedAtDesc(String username, Pageable pageable);

    // ✅ THÊM: Đếm số lượng records theo username
    long countByUser_Username(String username);

    // ✅ THÊM: Lấy N records mới nhất
    @Query("SELECT rh FROM ReviewHistory rh WHERE rh.user.username = :username ORDER BY rh.createdAt DESC")
    List<ReviewHistory> findTopByUsernameOrderByCreatedAtDesc(@Param("username") String username, Pageable pageable);

    // ✅ THÊM: Tìm theo user ID với sắp xếp
    List<ReviewHistory> findByUser_IdOrderByCreatedAtDesc(Long userId);

    // ✅ THÊM: Query tùy chỉnh để lấy thống kê
    @Query("SELECT COUNT(rh) FROM ReviewHistory rh WHERE rh.user.username = :username")
    long countReviewsByUsername(@Param("username") String username);

    // ✅ THÊM: Xóa các records cũ, chỉ giữ lại N records mới nhất
    @Query("DELETE FROM ReviewHistory rh WHERE rh.user.username = :username AND rh.id NOT IN " +
            "(SELECT rh2.id FROM ReviewHistory rh2 WHERE rh2.user.username = :username ORDER BY rh2.createdAt DESC LIMIT :keepCount)")
    void deleteOldHistoryKeepLatest(@Param("username") String username, @Param("keepCount") int keepCount);
}