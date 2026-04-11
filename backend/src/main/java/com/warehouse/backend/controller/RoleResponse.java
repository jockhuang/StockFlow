package com.warehouse.backend.controller;

import com.warehouse.backend.entity.Role;

import java.util.List;

public record RoleResponse(
        Long id,
        String code,
        String name,
        String description,
        List<Long> resourceIds,
        List<String> resourceCodes
) {
    public static RoleResponse from(Role role) {
        return new RoleResponse(
                role.getId(),
                role.getCode(),
                role.getName(),
                role.getDescription(),
                role.getResources().stream().map(resource -> resource.getId()).sorted().toList(),
                role.getResources().stream().map(resource -> resource.getCode()).sorted().toList()
        );
    }
}
