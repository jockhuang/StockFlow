package com.warehouse.backend.controller;

import com.warehouse.backend.entity.ResourceEntity;

public record ResourceResponse(
        Long id,
        String code,
        String name,
        String path,
        String httpMethod,
        String description
) {
    public static ResourceResponse from(ResourceEntity resource) {
        return new ResourceResponse(
                resource.getId(),
                resource.getCode(),
                resource.getName(),
                resource.getPath(),
                resource.getHttpMethod(),
                resource.getDescription()
        );
    }
}
