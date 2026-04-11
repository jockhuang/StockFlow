package com.warehouse.backend.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UserRequest(
        @NotBlank @Size(max = 64) String username,
        @Size(max = 128) String password,
        @NotBlank @Size(max = 120) String displayName,
        @NotNull Boolean enabled,
        @NotNull List<Long> roleIds
) {
}
