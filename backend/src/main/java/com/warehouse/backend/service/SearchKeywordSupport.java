package com.warehouse.backend.service;

import java.util.Arrays;
import java.util.stream.Collectors;

final class SearchKeywordSupport {

    /**
     * Minimum word length for MySQL InnoDB FULLTEXT indexing.
     * Default is 3 (innodb_ft_min_token_size = 3).
     * If MySQL is reconfigured to 2, lower this constant accordingly.
     */
    static final int FTS_MIN_WORD_LENGTH = 3;

    private SearchKeywordSupport() {
    }

    static String normalizeKeyword(String keyword) {
        return keyword == null || keyword.isBlank() ? null : keyword.trim();
    }

    /**
     * Returns true only for code-style inputs such as SKU prefixes, location codes,
     * or category codes — e.g. {@code WH-1001}, {@code A-01}, {@code B12}.
     *
     * <p>Rules:
     * <ul>
     *   <li>Only the characters {@code [A-Za-z0-9._:/-]} are allowed (no spaces).</li>
     *   <li>Must contain at least one non-alphabetic character (digit or punctuation),
     *       so that pure words like {@code "scanner"} or {@code "hardware"} are never
     *       treated as structured — they go to the FULLTEXT path where {@code search_text}
     *       is searched instead.</li>
     * </ul>
     */
    static boolean isStructuredKeyword(String keyword) {
        return keyword != null
                && !keyword.isBlank()
                && keyword.length() <= 64
                && keyword.matches("[A-Za-z0-9._:/-]+")   // allowed chars, no spaces
                && keyword.matches(".*[0-9._:/-].*");     // must have at least one non-alpha char
    }

    /**
     * Returns true when any word in the keyword is shorter than
     * {@link #FTS_MIN_WORD_LENGTH}, meaning MySQL FULLTEXT will silently ignore
     * that word. The caller should fall back to a LIKE query in this case.
     */
    static boolean needsShortKeywordFallback(String keyword) {
        if (keyword == null || keyword.isBlank()) return false;
        return Arrays.stream(keyword.trim().split("\\s+"))
                .anyMatch(word -> word.length() < FTS_MIN_WORD_LENGTH);
    }

    /**
     * Converts a free-text keyword into MySQL FULLTEXT BOOLEAN MODE syntax:
     * each word becomes {@code +word*} (required, prefix-match).
     * <p>
     * Example: {@code "bar scan"} → {@code "+bar* +scan*"}
     */
    static String prepareFtsKeyword(String keyword) {
        return Arrays.stream(keyword.trim().toLowerCase().split("\\s+"))
                .filter(word -> !word.isBlank())
                .map(word -> "+" + word + "*")
                .collect(Collectors.joining(" "));
    }

    /**
     * Normalizes arbitrary text for storage in the {@code search_text} column:
     * lowercased, trimmed, internal whitespace collapsed.
     * Null tokens are silently skipped.
     */
    static String buildSearchText(String... tokens) {
        return Arrays.stream(tokens)
                .filter(t -> t != null && !t.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(" "))
                .toLowerCase();
    }
}
