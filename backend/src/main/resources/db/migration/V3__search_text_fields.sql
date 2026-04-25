-- ============================================================
-- V3: Add denormalized search_text column to all searchable tables.
--
-- Purpose: replace multi-table LIKE '%keyword%' scans with a
--   single-column FULLTEXT index query, eliminating implicit JOINs
--   and enabling word-prefix search via BOOLEAN MODE.
--
-- Short-word support (< 3 chars):
--   MySQL InnoDB default innodb_ft_min_token_size = 3.
--   To index 2-character words, add the following to my.cnf and restart:
--     [mysqld]
--     innodb_ft_min_token_size = 2
--   Then rebuild the FULLTEXT indexes:
--     ALTER TABLE inventory_item    DROP INDEX ft_inventory_item_search,    ADD FULLTEXT INDEX ft_inventory_item_search   (search_text);
--     ALTER TABLE stock_movement    DROP INDEX ft_stock_movement_search,    ADD FULLTEXT INDEX ft_stock_movement_search   (search_text);
--     ALTER TABLE purchase_order    DROP INDEX ft_purchase_order_search,    ADD FULLTEXT INDEX ft_purchase_order_search   (search_text);
--     ALTER TABLE sales_order       DROP INDEX ft_sales_order_search,       ADD FULLTEXT INDEX ft_sales_order_search      (search_text);
-- ============================================================

-- ── inventory_item ──────────────────────────────────────────
ALTER TABLE inventory_item
    ADD COLUMN search_text TEXT NOT NULL DEFAULT '';

UPDATE inventory_item i
    JOIN inventory_category c ON i.category_id = c.id
    SET i.search_text = LOWER(TRIM(CONCAT_WS(' ', i.name, c.name)));

ALTER TABLE inventory_item
    ADD FULLTEXT INDEX ft_inventory_item_search (search_text);

-- ── stock_movement ──────────────────────────────────────────
ALTER TABLE stock_movement
    ADD COLUMN search_text TEXT NOT NULL DEFAULT '';

UPDATE stock_movement m
    JOIN  inventory_item    i ON m.inventory_item_id = i.id
    LEFT JOIN inventory_supplier s ON m.supplier_id    = s.id
    SET m.search_text = LOWER(TRIM(CONCAT_WS(' ',
        i.name,
        COALESCE(s.name, ''),
        COALESCE(m.partner_name, ''),
        COALESCE(m.remark, '')
    )));

ALTER TABLE stock_movement
    ADD FULLTEXT INDEX ft_stock_movement_search (search_text);

-- ── purchase_order ──────────────────────────────────────────
ALTER TABLE purchase_order
    ADD COLUMN search_text TEXT NOT NULL DEFAULT '';

UPDATE purchase_order p
    JOIN inventory_item   i ON p.inventory_item_id = i.id
    JOIN inventory_supplier s ON p.supplier_id      = s.id
    SET p.search_text = LOWER(TRIM(CONCAT_WS(' ', i.name, s.name)));

ALTER TABLE purchase_order
    ADD FULLTEXT INDEX ft_purchase_order_search (search_text);

-- ── sales_order ─────────────────────────────────────────────
ALTER TABLE sales_order
    ADD COLUMN search_text TEXT NOT NULL DEFAULT '';

UPDATE sales_order so
    JOIN inventory_item i ON so.inventory_item_id = i.id
    SET so.search_text = LOWER(TRIM(CONCAT_WS(' ',
        i.name,
        COALESCE(so.customer_name, '')
    )));

ALTER TABLE sales_order
    ADD FULLTEXT INDEX ft_sales_order_search (search_text);
