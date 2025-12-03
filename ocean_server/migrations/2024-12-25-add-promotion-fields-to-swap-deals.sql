-- Add promotion system fields to swap_deals table
-- This migration adds Boost, Top Placement, Spotlight, and Visibility Score fields to the swap_deals table
-- Note: SwapDeal was missing boost fields, so we're adding all promotion fields

ALTER TABLE `swap_deals`
ADD COLUMN `is_boosted` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether swap deal is currently boosted' AFTER `is_featured`,
ADD COLUMN `boost_expires_at` DATETIME NULL COMMENT 'When boost expires' AFTER `is_boosted`,
ADD COLUMN `boost_id` INT NULL COMMENT 'Reference to promotional boost' AFTER `boost_expires_at`,
ADD COLUMN `is_top_placed` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether swap deal is currently top placed' AFTER `boost_id`,
ADD COLUMN `top_placement_expires_at` DATETIME NULL COMMENT 'When top placement expires' AFTER `is_top_placed`,
ADD COLUMN `top_placement_id` INT NULL COMMENT 'Reference to top_placements table' AFTER `top_placement_expires_at`,
ADD COLUMN `is_spotlighted` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether swap deal is currently in spotlight' AFTER `top_placement_id`,
ADD COLUMN `spotlight_expires_at` DATETIME NULL COMMENT 'When spotlight expires' AFTER `is_spotlighted`,
ADD COLUMN `spotlight_id` INT NULL COMMENT 'Reference to spotlight_slots table' AFTER `spotlight_expires_at`,
ADD COLUMN `visibility_score` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Calculated visibility score for ranking' AFTER `spotlight_id`,
ADD COLUMN `last_score_update` DATETIME NULL COMMENT 'When visibility score was last calculated' AFTER `visibility_score`;

-- Add indexes for better query performance
CREATE INDEX `idx_swap_deals_is_boosted` ON `swap_deals`(`is_boosted`);
CREATE INDEX `idx_swap_deals_boost_expires_at` ON `swap_deals`(`boost_expires_at`);
CREATE INDEX `idx_swap_deals_is_top_placed` ON `swap_deals`(`is_top_placed`);
CREATE INDEX `idx_swap_deals_top_placement_expires_at` ON `swap_deals`(`top_placement_expires_at`);
CREATE INDEX `idx_swap_deals_is_spotlighted` ON `swap_deals`(`is_spotlighted`);
CREATE INDEX `idx_swap_deals_spotlight_expires_at` ON `swap_deals`(`spotlight_expires_at`);
CREATE INDEX `idx_swap_deals_visibility_score` ON `swap_deals`(`visibility_score`);
CREATE INDEX `idx_swap_deals_last_score_update` ON `swap_deals`(`last_score_update`);

-- Add foreign key constraints (optional - can be removed if you prefer not to enforce referential integrity)
-- ALTER TABLE `swap_deals`
-- ADD CONSTRAINT `fk_swap_deals_boost` FOREIGN KEY (`boost_id`) REFERENCES `promotional_boosts`(`id`) ON DELETE SET NULL,
-- ADD CONSTRAINT `fk_swap_deals_top_placement` FOREIGN KEY (`top_placement_id`) REFERENCES `top_placements`(`id`) ON DELETE SET NULL,
-- ADD CONSTRAINT `fk_swap_deals_spotlight` FOREIGN KEY (`spotlight_id`) REFERENCES `spotlight_slots`(`id`) ON DELETE SET NULL;

