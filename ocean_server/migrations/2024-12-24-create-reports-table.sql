-- =====================================================
-- REPORTS TABLE MIGRATION
-- =====================================================
-- This migration creates the necessary table for the user report system
-- Allows users to report other users, sellers, posts, products, videos, auctions, etc.
-- =====================================================

-- Drop table if it exists (for development re-runs)
DROP TABLE IF EXISTS `reports`;

-- Create reports table
CREATE TABLE IF NOT EXISTS `reports` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'UUID primary key',
  `reporter_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'User ID who made the report',
  `reported_user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'User/Seller ID being reported (for user/seller reports)',
  `report_type` enum('user','seller','post','product','video','auction','swap_deal','distress_sale','bulk_purchase','comment') NOT NULL COMMENT 'Type of content being reported',
  `item_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'ID of the reported item (post, product, video, etc.)',
  `reason` enum('spam','inappropriate_content','scam_fraud','harassment','fake_product','copyright_violation','other') NOT NULL COMMENT 'Reason for the report',
  `description` text DEFAULT NULL COMMENT 'Additional details provided by the reporter',
  `status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending' COMMENT 'Status of the report',
  `admin_notes` text DEFAULT NULL COMMENT 'Internal notes from admin reviewing the report',
  `resolved_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Admin user ID who resolved the report',
  `resolved_at` timestamp NULL DEFAULT NULL COMMENT 'Timestamp when report was resolved',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reporter_id` (`reporter_id`),
  KEY `idx_reported_user_id` (`reported_user_id`),
  KEY `idx_report_type` (`report_type`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_reason` (`reason`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_resolved_by` (`resolved_by`),
  KEY `idx_reporter_type_item` (`reporter_id`, `report_type`, `item_id`),
  CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_report_reported_user` FOREIGN KEY (`reported_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_report_resolved_by` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User reports table for reporting inappropriate content and users';

-- Note: Duplicate prevention will be handled at the application level
-- to allow flexibility (e.g., users can report the same item again after a certain time period)

