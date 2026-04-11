package com.warehouse.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "warehouse.security")
public record SecuritySeedProperties(
        String seedAdminUsername,
        String seedAdminPassword
) {
}
