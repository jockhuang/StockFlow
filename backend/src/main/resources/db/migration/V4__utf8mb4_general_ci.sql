-- ============================================================
-- V4: Unify all table/column charsets to utf8mb4 / utf8mb4_general_ci.
--
-- CONVERT TO CHARACTER SET converts:
--   - the table default charset & collation
--   - every character-type column (CHAR, VARCHAR, TEXT, ENUM, ...)
--   - rebuilds all related indexes (including FULLTEXT)
--
-- Numeric, date, and binary columns are unaffected.
-- ============================================================

-- Set database-level default so any future tables created by
-- Hibernate (ddl-auto=update) inherit the correct charset.
ALTER DATABASE warehouse
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_general_ci;

-- ── Business entity tables ───────────────────────────────────
ALTER TABLE inventory_item
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE inventory_category
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE inventory_supplier
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE stock_movement
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE purchase_order
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE sales_order
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- ── System / auth tables ─────────────────────────────────────
ALTER TABLE sys_user
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE sys_role
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE sys_resource
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- ── Join tables (only id columns, no char data, but set default anyway) ──
ALTER TABLE inventory_item_supplier
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE sys_user_role
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE sys_role_resource
    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
