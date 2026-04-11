package com.warehouse.backend.service;

import org.springframework.data.domain.Sort;

import java.util.Set;

final class SortSupport {

    private SortSupport() {
    }

    static Sort resolveSort(String sortBy, String sortDir, String defaultProperty, Set<String> allowedProperties) {
        String property = allowedProperties.contains(sortBy) ? sortBy : defaultProperty;
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(new Sort.Order(direction, property), new Sort.Order(Sort.Direction.DESC, "id"));
    }
}
