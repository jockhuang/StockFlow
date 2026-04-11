CREATE TABLE IF NOT EXISTS inventory_category (
    id BIGINT NOT NULL AUTO_INCREMENT,
    code VARCHAR(80) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT uk_inventory_category_code UNIQUE (code)
);

INSERT INTO inventory_category (code, name, description)
SELECT 'UNCATEGORIZED', 'Uncategorized', 'Default category for migrated legacy inventory rows'
WHERE NOT EXISTS (
    SELECT 1
    FROM inventory_category
    WHERE code = 'UNCATEGORIZED'
);

SET @inventory_item_exists = (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'inventory_item'
);

SET @category_column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'inventory_item'
      AND column_name = 'category_id'
);

SET @add_category_column_sql = IF(
    @inventory_item_exists > 0 AND @category_column_exists = 0,
    'ALTER TABLE inventory_item ADD COLUMN category_id BIGINT NULL',
    'SELECT 1'
);
PREPARE add_category_column_stmt FROM @add_category_column_sql;
EXECUTE add_category_column_stmt;
DEALLOCATE PREPARE add_category_column_stmt;

SET @backfill_inventory_category_sql = IF(
    @inventory_item_exists > 0,
    'UPDATE inventory_item
        SET category_id = (
            SELECT id
            FROM inventory_category
            WHERE code = ''UNCATEGORIZED''
            LIMIT 1
        )
      WHERE category_id IS NULL',
    'SELECT 1'
);
PREPARE backfill_inventory_category_stmt FROM @backfill_inventory_category_sql;
EXECUTE backfill_inventory_category_stmt;
DEALLOCATE PREPARE backfill_inventory_category_stmt;

SET @inventory_category_index_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'inventory_item'
      AND index_name = 'idx_inventory_item_category_id'
);

SET @add_inventory_category_index_sql = IF(
    @inventory_item_exists > 0 AND @inventory_category_index_exists = 0,
    'ALTER TABLE inventory_item ADD INDEX idx_inventory_item_category_id (category_id)',
    'SELECT 1'
);
PREPARE add_inventory_category_index_stmt FROM @add_inventory_category_index_sql;
EXECUTE add_inventory_category_index_stmt;
DEALLOCATE PREPARE add_inventory_category_index_stmt;

SET @inventory_category_fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.table_constraints
    WHERE table_schema = DATABASE()
      AND table_name = 'inventory_item'
      AND constraint_name = 'fk_inventory_item_category'
      AND constraint_type = 'FOREIGN KEY'
);

SET @add_inventory_category_fk_sql = IF(
    @inventory_item_exists > 0 AND @inventory_category_fk_exists = 0,
    'ALTER TABLE inventory_item
        ADD CONSTRAINT fk_inventory_item_category
        FOREIGN KEY (category_id)
        REFERENCES inventory_category (id)',
    'SELECT 1'
);
PREPARE add_inventory_category_fk_stmt FROM @add_inventory_category_fk_sql;
EXECUTE add_inventory_category_fk_stmt;
DEALLOCATE PREPARE add_inventory_category_fk_stmt;
