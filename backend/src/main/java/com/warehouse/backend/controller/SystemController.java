package com.warehouse.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('SYSTEM_READ')")
    public Map<String, Object> summary() {
        return Map.of(
                "application", "warehouse-backend",
                "status", "UP",
                "timestamp", Instant.now().toString()
        );
    }
}
