package com.warehouse.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("warehouse.jwt")
public record JwtProperties(
        String secret,
        long expirationSeconds,
        long refreshExpirationSeconds
) {
    public JwtProperties {
        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException(
                    "warehouse.jwt.secret must be at least 32 characters long");
        }
        if (expirationSeconds <= 0) {
            throw new IllegalArgumentException(
                    "warehouse.jwt.expiration-seconds must be positive");
        }
        if (refreshExpirationSeconds <= 0) {
            throw new IllegalArgumentException(
                    "warehouse.jwt.refresh-expiration-seconds must be positive");
        }
    }
}
