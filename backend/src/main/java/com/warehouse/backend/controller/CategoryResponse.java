package com.warehouse.backend.controller;

import com.warehouse.backend.entity.Category;

public record CategoryResponse(
        Long id,
        String code,
        String name,
        String description
) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getCode(), category.getName(), category.getDescription());
    }
}
