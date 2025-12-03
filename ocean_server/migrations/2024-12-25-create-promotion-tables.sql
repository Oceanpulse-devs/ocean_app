-- Create promotion system tables
-- This migration creates the new tables for Top Placement, Spotlight, and Visibility Score tracking

-- ============================================
-- 1. TOP PLACEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `top_placements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Reference to users table (UUID as CHAR)',
  `subscription_id` INT NOT NULL COMMENT 'Reference to user_subscriptions table',
  `item_type` ENUM('product', 'group_buy', 'swap_deal', 'auction', 'distress_sale') NOT NULL COMMENT 'Type of item being placed at top',
  `item_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ID of the item being placed (UUID as CHAR)',
  `category` VARCHAR(100) NULL COMMENT 'Category where placement is active (null for all categories)',
  `placement_type` ENUM('category', 'search', 'homepage') NOT NULL DEFAULT 'category' COMMENT 'Where the top placement appears',
  `duration_days` INT NOT NULL COMMENT 'Duration in days (3, 7, or 14)',
  `start_date` DATETIME NOT NULL COMMENT 'When placement starts',
  `end_date` DATETIME NOT NULL COMMENT 'When placement ends',
  `status` ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active' COMMENT 'Current status of the placement',
  `priority` INT NOT NULL DEFAULT 0 COMMENT 'Priority order when multiple placements exist (higher = shown first)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_top_placements_user_id` (`user_id`),
  INDEX `idx_top_placements_item` (`item_type`, `item_id`),
  INDEX `idx_top_placements_category` (`category`),
  INDEX `idx_top_placements_placement_type` (`placement_type`),
  INDEX `idx_top_placements_status` (`status`),
  INDEX `idx_top_placements_end_date` (`end_date`),
  INDEX `idx_top_placements_dates` (`start_date`, `end_date`),
  INDEX `idx_top_placements_priority` (`priority`),
  
  FOREIGN KEY (`subscription_id`) REFERENCES `user_subscriptions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks top placement purchases and durations';

-- ============================================
-- 2. SPOTLIGHT SLOTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `spotlight_slots` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Reference to users table (UUID as CHAR)',
  `subscription_id` INT NOT NULL COMMENT 'Reference to user_subscriptions table',
  `item_type` ENUM('product', 'group_buy', 'swap_deal', 'auction', 'distress_sale') NOT NULL COMMENT 'Type of item being featured in spotlight',
  `item_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ID of the item being featured (UUID as CHAR)',
  `slot_type` ENUM('homepage', 'category', 'search') NOT NULL COMMENT 'Where the spotlight appears',
  `category` VARCHAR(100) NULL COMMENT 'Category for category-specific spotlight (null for homepage/search)',
  `duration_days` INT NOT NULL COMMENT 'Duration in days (7 or 14)',
  `start_date` DATETIME NOT NULL COMMENT 'When spotlight starts',
  `end_date` DATETIME NOT NULL COMMENT 'When spotlight ends',
  `display_order` INT NOT NULL DEFAULT 0 COMMENT 'Order in which items appear in spotlight (lower = shown first)',
  `status` ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active' COMMENT 'Current status of the spotlight',
  `impressions` INT NOT NULL DEFAULT 0 COMMENT 'Number of times spotlight item was shown',
  `clicks` INT NOT NULL DEFAULT 0 COMMENT 'Number of clicks on spotlight item',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_spotlight_slots_user_id` (`user_id`),
  INDEX `idx_spotlight_slots_item` (`item_type`, `item_id`),
  INDEX `idx_spotlight_slots_slot_type` (`slot_type`),
  INDEX `idx_spotlight_slots_category` (`category`),
  INDEX `idx_spotlight_slots_status` (`status`),
  INDEX `idx_spotlight_slots_end_date` (`end_date`),
  INDEX `idx_spotlight_slots_dates` (`start_date`, `end_date`),
  INDEX `idx_spotlight_slots_display_order` (`display_order`),
  INDEX `idx_spotlight_slots_composite` (`slot_type`, `status`, `display_order`),
  
  FOREIGN KEY (`subscription_id`) REFERENCES `user_subscriptions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks spotlight/featured placements';

-- ============================================
-- 3. VISIBILITY SCORES TABLE (Optional - for history tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS `visibility_scores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_type` ENUM('product', 'group_buy', 'swap_deal', 'auction', 'distress_sale') NOT NULL COMMENT 'Type of item',
  `item_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ID of the item (UUID as CHAR)',
  `visibility_score` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Calculated visibility score',
  `score_breakdown` JSON NULL COMMENT 'JSON object with score component breakdown',
  `calculated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When score was calculated',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY `unique_item_score` (`item_type`, `item_id`),
  INDEX `idx_visibility_scores_score` (`visibility_score`),
  INDEX `idx_visibility_scores_calculated_at` (`calculated_at`),
  INDEX `idx_visibility_scores_item_score` (`item_type`, `visibility_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks visibility score history for items';

