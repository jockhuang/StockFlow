package com.warehouse.backend.controller;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record InventoryRequest(
        @NotBlank @Size(max = 120) String sku,
        @NotBlank @Size(max = 120) String name,
        @NotNull @Min(0) Integer quantity,
        @NotBlank @Size(max = 80) String location,
        @NotNull Long categoryId,
        List<Long> supplierIds
) {
}
