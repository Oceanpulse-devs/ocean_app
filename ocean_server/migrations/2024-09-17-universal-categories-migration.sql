-- Migration: Universal Categories System
-- Date: 2024-09-17
-- Description: Update category system to support universal categories and custom user categories

-- Add new columns to productcategories table (only if they don't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'productcategories' 
     AND COLUMN_NAME = 'isCustom') = 0,
    'ALTER TABLE productcategories ADD COLUMN isCustom BOOLEAN DEFAULT FALSE COMMENT ''Whether this category was created by a user (custom) or is a system category''',
    'SELECT ''Column isCustom already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'productcategories' 
     AND COLUMN_NAME = 'createdBy') = 0,
    'ALTER TABLE productcategories ADD COLUMN createdBy CHAR(36) NULL COMMENT ''User ID who created this custom category (null for system categories)''',
    'SELECT ''Column createdBy already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'productcategories' 
     AND COLUMN_NAME = 'usageCount') = 0,
    'ALTER TABLE productcategories ADD COLUMN usageCount INT DEFAULT 0 COMMENT ''Number of times this category has been used in products''',
    'SELECT ''Column usageCount already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop existing foreign key constraint if it exists (to avoid conflicts)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'productcategories' 
     AND CONSTRAINT_NAME = 'fk_productcategories_createdBy') > 0,
    'ALTER TABLE productcategories DROP FOREIGN KEY fk_productcategories_createdBy',
    'SELECT ''No existing foreign key constraint to drop'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Debug: Check the exact data type and collation of users.id column
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    CHARACTER_SET_NAME,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'id';

-- Get the exact data type and collation from users.id and apply it to createdBy
SET @sql = CONCAT(
    'ALTER TABLE productcategories MODIFY COLUMN createdBy ',
    (SELECT CONCAT(
        DATA_TYPE, 
        CASE 
            WHEN CHARACTER_MAXIMUM_LENGTH IS NOT NULL THEN CONCAT('(', CHARACTER_MAXIMUM_LENGTH, ')')
            ELSE ''
        END,
        CASE 
            WHEN CHARACTER_SET_NAME IS NOT NULL THEN CONCAT(' CHARACTER SET ', CHARACTER_SET_NAME)
            ELSE ''
        END,
        CASE 
            WHEN COLLATION_NAME IS NOT NULL THEN CONCAT(' COLLATE ', COLLATION_NAME)
            ELSE ''
        END,
        ' NULL'
    ) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'id'),
    ' COMMENT ''User ID who created this custom category (null for system categories)'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint for createdBy
ALTER TABLE productcategories 
ADD CONSTRAINT fk_productcategories_createdBy 
FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes for better performance (only if they don't exist)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'productcategories' 
     AND INDEX_NAME = 'idx_productcategories_isCustom') = 0,
    'CREATE INDEX idx_productcategories_isCustom ON productcategories(isCustom)',
    'SELECT ''Index idx_productcategories_isCustom already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'productcategories' 
     AND INDEX_NAME = 'idx_productcategories_createdBy') = 0,
    'CREATE INDEX idx_productcategories_createdBy ON productcategories(createdBy)',
    'SELECT ''Index idx_productcategories_createdBy already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'productcategories' 
     AND INDEX_NAME = 'idx_productcategories_usageCount') = 0,
    'CREATE INDEX idx_productcategories_usageCount ON productcategories(usageCount)',
    'SELECT ''Index idx_productcategories_usageCount already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing categories to be system categories (not custom)
UPDATE productcategories SET isCustom = FALSE WHERE isCustom IS NULL;

-- Clear existing categories to start fresh with universal system
-- Temporarily disable safe update mode for this operation
SET SQL_SAFE_UPDATES = 0;
DELETE FROM productcategories;
SET SQL_SAFE_UPDATES = 1;

-- Insert new universal categories (system categories)
INSERT INTO productcategories (id, name, description, icon, parentId, isActive, sortOrder, isCustom, createdBy, usageCount, createdAt, updatedAt) VALUES
-- Main Universal Categories
(UUID(), 'Tech', 'Technology, electronics, software, and digital products', '📱', NULL, TRUE, 1, FALSE, NULL, 0, NOW(), NOW()),
(UUID(), 'Fashion', 'Clothing, shoes, accessories, and style items', '👗', NULL, TRUE, 2, FALSE, NULL, 0, NOW(), NOW()),
(UUID(), 'Home & Living', 'Furniture, home decor, appliances, and household items', '🏠', NULL, TRUE, 3, FALSE, NULL, 0, NOW(), NOW()),
(UUID(), 'Automotive', 'Cars, motorcycles, auto parts, and vehicle accessories', '🚗', NULL, TRUE, 4, FALSE, NULL, 0, NOW(), NOW()),
(UUID(), 'Sports & Fitness', 'Sports equipment, fitness gear, and athletic apparel', '⚽', NULL, TRUE, 5, FALSE, NULL, 0, NOW(), NOW()),
(UUID(), 'Books & Education', 'Books, educational materials, courses, and learning resources', '📚', NULL, TRUE, 6, FALSE, NULL, 0, NOW(), NOW()),
(UUID(), 'Health & Beauty', 'Health products, beauty items, and wellness equipment', '💄', NULL, TRUE, 7, FALSE, NULL, 0, NOW(), NOW()),
(UUID(), 'Entertainment', 'Games, toys, collectibles, and entertainment items', '🎮', NULL, TRUE, 8, FALSE, NULL, 0, NOW(), NOW()),
(UUID(), 'Jewelry & Watches', 'Jewelry, watches, and luxury accessories', '💍', NULL, TRUE, 9, FALSE, NULL, 0, NOW(), NOW()),
(UUID(), 'Art & Collectibles', 'Artwork, antiques, rare items, and collectibles', '🎨', NULL, TRUE, 10, FALSE, NULL, 0, NOW(), NOW()),
(UUID(), 'Other', 'Custom categories and miscellaneous items', '➕', NULL, TRUE, 11, FALSE, NULL, 0, NOW(), NOW());

-- Main categories only - no subcategories needed

-- Note: Usage tracking triggers removed because products table uses 'category' (string) 
-- instead of 'categoryId' (UUID foreign key). Usage tracking will need to be implemented
-- at the application level when products are created/updated/deleted.

-- Add comments for documentation
ALTER TABLE productcategories COMMENT = 'Universal category system supporting both system categories and custom user-created categories';
