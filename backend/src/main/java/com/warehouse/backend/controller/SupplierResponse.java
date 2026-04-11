package com.warehouse.backend.controller;

import com.warehouse.backend.entity.Supplier;

import java.util.List;

public record SupplierResponse(
        Long id,
        String code,
        String name,
        String contactPerson,
        String phone,
        String email,
        String address,
        String description,
        List<Long> inventoryItemIds,
        List<String> inventoryItemNames
) {
    public static SupplierResponse from(Supplier supplier) {
        return new SupplierResponse(
                supplier.getId(),
                supplier.getCode(),
                supplier.getName(),
                supplier.getContactPerson(),
                supplier.getPhone(),
                supplier.getEmail(),
                supplier.getAddress(),
                supplier.getDescription(),
                supplier.getInventoryItems().stream().map(item -> item.getId()).sorted().toList(),
                supplier.getInventoryItems().stream().map(item -> item.getSku() + " · " + item.getName()).sorted().toList()
        );
    }
}
