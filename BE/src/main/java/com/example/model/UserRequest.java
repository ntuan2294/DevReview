package com.example.model;

public class UserRequest {
    private String username;
    private String password;

    public UserRequest() {
    } // Constructor rỗng cần thiết để Spring bind JSON

    // Getter Setter
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
}
