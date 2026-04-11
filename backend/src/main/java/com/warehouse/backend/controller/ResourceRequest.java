package com.warehouse.backend.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResourceRequest(
        @NotBlank @Size(max = 100) String code,
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 120) String path,
        @NotBlank @Size(max = 16) String httpMethod,
        @Size(max = 255) String description
) {
}
