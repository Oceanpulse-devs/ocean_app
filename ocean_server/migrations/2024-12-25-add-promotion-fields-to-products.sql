-- Add promotion system fields to products table
-- This migration adds Top Placement, Spotlight, and Visibility Score fields to the products table

ALTER TABLE `products`
ADD COLUMN `is_top_placed` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether product is currently top placed' AFTER `boost_id`,
ADD COLUMN `top_placement_expires_at` DATETIME NULL COMMENT 'When top placement expires' AFTER `is_top_placed`,
ADD COLUMN `top_placement_id` INT NULL COMMENT 'Reference to top_placements table' AFTER `top_placement_expires_at`,
ADD COLUMN `is_spotlighted` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether product is currently in spotlight' AFTER `top_placement_id`,
ADD COLUMN `spotlight_expires_at` DATETIME NULL COMMENT 'When spotlight expires' AFTER `is_spotlighted`,
ADD COLUMN `spotlight_id` INT NULL COMMENT 'Reference to spotlight_slots table' AFTER `spotlight_expires_at`,
ADD COLUMN `visibility_score` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Calculated visibility score for ranking' AFTER `spotlight_id`,
ADD COLUMN `last_score_update` DATETIME NULL COMMENT 'When visibility score was last calculated' AFTER `visibility_score`;

-- Add indexes for better query performance
CREATE INDEX `idx_products_is_top_placed` ON `products`(`is_top_placed`);
CREATE INDEX `idx_products_top_placement_expires_at` ON `products`(`top_placement_expires_at`);
CREATE INDEX `idx_products_is_spotlighted` ON `products`(`is_spotlighted`);
CREATE INDEX `idx_products_spotlight_expires_at` ON `products`(`spotlight_expires_at`);
CREATE INDEX `idx_products_visibility_score` ON `products`(`visibility_score`);
CREATE INDEX `idx_products_last_score_update` ON `products`(`last_score_update`);

-- Add foreign key constraints (optional - can be removed if you prefer not to enforce referential integrity)
-- ALTER TABLE `products`
-- ADD CONSTRAINT `fk_products_top_placement` FOREIGN KEY (`top_placement_id`) REFERENCES `top_placements`(`id`) ON DELETE SET NULL,
-- ADD CONSTRAINT `fk_products_spotlight` FOREIGN KEY (`spotlight_id`) REFERENCES `spotlight_slots`(`id`) ON DELETE SET NULL;

