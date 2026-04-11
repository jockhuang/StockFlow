package com.warehouse.backend.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SupplierRequest(
        @NotBlank @Size(max = 80) String code,
        @NotBlank @Size(max = 120) String name,
        @Size(max = 120) String contactPerson,
        @Size(max = 40) String phone,
        @Size(max = 120) String email,
        @Size(max = 255) String address,
        @Size(max = 255) String description,
        List<Long> inventoryItemIds
) {
}
