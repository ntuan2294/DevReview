package com.example.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;

    private String password;

    // ✅ THÊM: Relationship với ReviewHistory + @JsonIgnore để tránh circular
    // reference
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnore // ⭐ QUAN TRỌNG: Tránh serialize relationship này
    private List<ReviewHistory> reviewHistories;

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public List<ReviewHistory> getReviewHistories() {
        return reviewHistories;
    }

    public void setReviewHistories(List<ReviewHistory> reviewHistories) {
        this.reviewHistories = reviewHistories;
    }
}