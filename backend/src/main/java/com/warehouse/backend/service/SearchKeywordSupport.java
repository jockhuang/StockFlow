package com.warehouse.backend.service;

final class SearchKeywordSupport {

    private SearchKeywordSupport() {
    }

    static String normalizeKeyword(String keyword) {
        return keyword == null || keyword.isBlank() ? null : keyword.trim();
    }

    static boolean isStructuredKeyword(String keyword) {
        return keyword != null
                && !keyword.isBlank()
                && keyword.length() <= 64
                && keyword.matches("[A-Za-z0-9._:/-]+");
    }
}
