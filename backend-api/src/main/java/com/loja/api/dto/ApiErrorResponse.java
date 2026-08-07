package com.loja.api.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record ApiErrorResponse(
        LocalDateTime timestamp,
        int status,
        String code,
        String error,
        String message,
        String path,
        Map<String, String> fields) {

    public static ApiErrorResponse of(int status, String code, String error, String message, String path) {
        return new ApiErrorResponse(LocalDateTime.now(), status, code, error, message, path, Map.of());
    }
}
