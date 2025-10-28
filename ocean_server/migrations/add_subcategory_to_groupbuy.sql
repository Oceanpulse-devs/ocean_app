-- Add subcategory column to group_buys table
ALTER TABLE group_buys
ADD COLUMN subcategory VARCHAR(255) NULL COMMENT 'Subcategory for the group buy product' AFTER category_id;

