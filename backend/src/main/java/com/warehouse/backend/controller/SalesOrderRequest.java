package com.warehouse.backend.controller;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record SalesOrderRequest(
        @NotNull Long inventoryItemId,
        @NotNull @Min(1) Integer quantity,
        @DecimalMin("0.00") BigDecimal unitPrice,
        @Size(max = 120) String customerName,
        @Size(max = 120) String referenceNo,
        @Size(max = 255) String remark
) {
}
