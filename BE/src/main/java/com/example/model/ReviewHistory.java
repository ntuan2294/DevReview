package com.example.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "review_history")
public class ReviewHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({ "reviewHistories", "password" })
    private User user;

    @Column(name = "original_code", columnDefinition = "TEXT")
    private String originalCode;

    @Column(name = "review_summary", columnDefinition = "TEXT")
    private String reviewSummary;

    @Column(name = "fixed_code", columnDefinition = "TEXT")
    private String fixedCode;

    @Column(name = "language", length = 50)
    private String language;

    // ✅ THÊM: Field để lưu vị trí các dòng bị lỗi
    @Column(name = "error_lines", columnDefinition = "TEXT")
    private String errorLines; // Lưu dạng JSON array string: "[1,5,10]"

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.language == null || this.language.trim().isEmpty()) {
            this.language = "unknown";
        }
    }

    // === CONSTRUCTORS ===
    public ReviewHistory() {
    }

    public ReviewHistory(User user, String originalCode, String reviewSummary, String fixedCode, String language) {
        this.user = user;
        this.originalCode = originalCode;
        this.reviewSummary = reviewSummary;
        this.fixedCode = fixedCode;
        this.language = language != null && !language.trim().isEmpty() ? language.trim() : "unknown";
        this.createdAt = LocalDateTime.now();
    }

    // ✅ THÊM: Constructor với error lines
    public ReviewHistory(User user, String originalCode, String reviewSummary, String fixedCode,
            String language, String errorLines) {
        this.user = user;
        this.originalCode = originalCode;
        this.reviewSummary = reviewSummary;
        this.fixedCode = fixedCode;
        this.language = language != null && !language.trim().isEmpty() ? language.trim() : "unknown";
        this.errorLines = errorLines;
        this.createdAt = LocalDateTime.now();
    }

    // === GETTERS & SETTERS ===
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getOriginalCode() {
        return originalCode;
    }

    public void setOriginalCode(String originalCode) {
        this.originalCode = originalCode;
    }

    public String getReviewSummary() {
        return reviewSummary;
    }

    public void setReviewSummary(String reviewSummary) {
        this.reviewSummary = reviewSummary;
    }

    public String getFixedCode() {
        return fixedCode;
    }

    public void setFixedCode(String fixedCode) {
        this.fixedCode = fixedCode;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language != null && !language.trim().isEmpty() ? language.trim() : "unknown";
    }

    // ✅ THÊM: Getter/Setter cho error lines
    public String getErrorLines() {
        return errorLines;
    }

    public void setErrorLines(String errorLines) {
        this.errorLines = errorLines;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // ✅ toString() tránh circular reference
    @Override
    public String toString() {
        return "ReviewHistory{" +
                "id=" + id +
                ", language='" + language + '\'' +
                ", errorLines='" + errorLines + '\'' +
                ", createdAt=" + createdAt +
                ", userId=" + (user != null ? user.getId() : null) +
                '}';
    }

    public void setSuggest(String suggest) {

        throw new UnsupportedOperationException("Unimplemented method 'setSuggest'");
    }
}