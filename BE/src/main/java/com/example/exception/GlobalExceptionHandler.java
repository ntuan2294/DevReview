package com.example.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAllExceptions(Exception ex) {
        Map<String, Object> res = new HashMap<>();
        res.put("success", false);
        res.put("error", ex.getClass().getSimpleName());
        res.put("message", ex.getMessage());
        return new ResponseEntity<>(res, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        Map<String, Object> res = new HashMap<>();
        res.put("success", false);
        res.put("message", "Tên đăng nhập đã tồn tại hoặc dữ liệu không hợp lệ.");
        return new ResponseEntity<>(res, HttpStatus.BAD_REQUEST);
    }
}
