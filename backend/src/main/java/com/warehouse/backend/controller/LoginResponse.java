package com.warehouse.backend.controller;

public record LoginResponse(
        String accessToken,
        long expiresIn,
        String refreshToken,
        long refreshExpiresIn
) {}
