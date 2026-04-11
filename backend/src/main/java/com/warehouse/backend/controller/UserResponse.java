package com.warehouse.backend.controller;

import com.warehouse.backend.entity.UserAccount;

import java.util.List;

public record UserResponse(
        Long id,
        String username,
        String displayName,
        Boolean enabled,
        List<Long> roleIds,
        List<String> roleCodes
) {
    public static UserResponse from(UserAccount user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getEnabled(),
                user.getRoles().stream().map(role -> role.getId()).sorted().toList(),
                user.getRoles().stream().map(role -> role.getCode()).sorted().toList()
        );
    }
}
