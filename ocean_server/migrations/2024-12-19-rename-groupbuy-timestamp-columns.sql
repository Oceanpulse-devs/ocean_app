-- Migration: Rename GroupBuy timestamp columns to match Sequelize conventions
-- Date: 2024-12-19
-- Purpose: Fix database schema mismatch for GroupBuy model

-- Rename created_at to createdAt in group_buys table
ALTER TABLE `group_buys` 
CHANGE COLUMN `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Rename updated_at to updatedAt in group_buys table  
ALTER TABLE `group_buys`
CHANGE COLUMN `updated_at` `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Rename created_at to createdAt in group_buy_participants table
ALTER TABLE `group_buy_participants`
CHANGE COLUMN `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Rename updated_at to updatedAt in group_buy_participants table
ALTER TABLE `group_buy_participants` 
CHANGE COLUMN `updated_at` `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Update indexes to use new column names
DROP INDEX IF EXISTS `idx_group_buy_created_at` ON `group_buys`;
CREATE INDEX `idx_group_buy_createdAt` ON `group_buys` (`createdAt`);

-- Verify the changes
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'group_buys' 
AND COLUMN_NAME IN ('createdAt', 'updatedAt');

SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'group_buy_participants' 
AND COLUMN_NAME IN ('createdAt', 'updatedAt');

