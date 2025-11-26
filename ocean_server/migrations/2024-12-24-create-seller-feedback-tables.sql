-- =====================================================
-- SELLER FEEDBACK TABLES MIGRATION
-- =====================================================
-- This migration creates the necessary tables for the seller feedback system
-- Allows buyers to rate and review sellers, with seller response capability
-- =====================================================

-- Drop tables if they exist (for development re-runs)
DROP TABLE IF EXISTS `seller_feedback_responses`;
DROP TABLE IF EXISTS `seller_feedback_likes`;
DROP TABLE IF EXISTS `seller_feedback`;

-- Create seller_feedback table
CREATE TABLE IF NOT EXISTS `seller_feedback` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'UUID primary key',
  `seller_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ID of the seller being reviewed',
  `reviewer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ID of the buyer leaving feedback',
  `rating` int(11) NOT NULL COMMENT 'Rating from 1 to 5 stars',
  `comment` text DEFAULT NULL COMMENT 'Feedback comment text',
  `like_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of likes on this feedback',
  `status` enum('active','deleted','hidden') NOT NULL DEFAULT 'active' COMMENT 'Feedback status',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_seller_reviewer` (`seller_id`, `reviewer_id`),
  KEY `idx_seller_id` (`seller_id`),
  KEY `idx_reviewer_id` (`reviewer_id`),
  KEY `idx_rating` (`rating`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_like_count` (`like_count`),
  CONSTRAINT `fk_feedback_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedback_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_rating_range` CHECK (`rating` >= 1 AND `rating` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Seller feedback/reviews table';

-- Create seller_feedback_likes table for tracking likes on feedback
CREATE TABLE IF NOT EXISTS `seller_feedback_likes` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'UUID primary key',
  `feedback_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ID of the feedback being liked',
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'User ID who liked the feedback',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_feedback_user_like` (`feedback_id`, `user_id`),
  KEY `idx_feedback_id` (`feedback_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_feedback_like_feedback` FOREIGN KEY (`feedback_id`) REFERENCES `seller_feedback` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedback_like_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Seller feedback likes tracking table';

-- Create seller_feedback_responses table for seller replies to feedback
CREATE TABLE IF NOT EXISTS `seller_feedback_responses` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'UUID primary key',
  `feedback_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ID of the feedback being responded to',
  `seller_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ID of the seller responding',
  `response_text` text NOT NULL COMMENT 'Seller response text',
  `is_edited` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether the response has been edited',
  `like_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of likes on this response',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_feedback_response` (`feedback_id`),
  KEY `idx_feedback_id` (`feedback_id`),
  KEY `idx_seller_id` (`seller_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_response_feedback` FOREIGN KEY (`feedback_id`) REFERENCES `seller_feedback` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_response_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Seller responses to feedback table';

-- Create seller_feedback_response_likes table for tracking likes on seller responses
CREATE TABLE IF NOT EXISTS `seller_feedback_response_likes` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'UUID primary key',
  `response_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ID of the response being liked',
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'User ID who liked the response',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_response_user_like` (`response_id`, `user_id`),
  KEY `idx_response_id` (`response_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_response_like_response` FOREIGN KEY (`response_id`) REFERENCES `seller_feedback_responses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_response_like_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Seller feedback response likes tracking table';

-- =====================================================
-- TRIGGERS FOR AUTOMATIC COUNTER UPDATES
-- =====================================================

DELIMITER $$

-- Trigger to update feedback like_count when a like is added
DROP TRIGGER IF EXISTS `tr_feedback_like_insert`$$
CREATE TRIGGER `tr_feedback_like_insert`
AFTER INSERT ON `seller_feedback_likes`
FOR EACH ROW
BEGIN
    UPDATE `seller_feedback`
    SET `like_count` = `like_count` + 1
    WHERE `id` = NEW.feedback_id;
END$$

-- Trigger to update feedback like_count when a like is removed
DROP TRIGGER IF EXISTS `tr_feedback_like_delete`$$
CREATE TRIGGER `tr_feedback_like_delete`
AFTER DELETE ON `seller_feedback_likes`
FOR EACH ROW
BEGIN
    UPDATE `seller_feedback`
    SET `like_count` = GREATEST(`like_count` - 1, 0)
    WHERE `id` = OLD.feedback_id;
END$$

-- Trigger to update response like_count when a like is added
DROP TRIGGER IF EXISTS `tr_response_like_insert`$$
CREATE TRIGGER `tr_response_like_insert`
AFTER INSERT ON `seller_feedback_response_likes`
FOR EACH ROW
BEGIN
    UPDATE `seller_feedback_responses`
    SET `like_count` = `like_count` + 1
    WHERE `id` = NEW.response_id;
END$$

-- Trigger to update response like_count when a like is removed
DROP TRIGGER IF EXISTS `tr_response_like_delete`$$
CREATE TRIGGER `tr_response_like_delete`
AFTER DELETE ON `seller_feedback_response_likes`
FOR EACH ROW
BEGIN
    UPDATE `seller_feedback_responses`
    SET `like_count` = GREATEST(`like_count` - 1, 0)
    WHERE `id` = OLD.response_id;
END$$

-- Trigger to set is_edited flag when response is updated
DROP TRIGGER IF EXISTS `tr_response_update_edited`$$
CREATE TRIGGER `tr_response_update_edited`
BEFORE UPDATE ON `seller_feedback_responses`
FOR EACH ROW
BEGIN
    IF OLD.response_text != NEW.response_text THEN
        SET NEW.is_edited = 1;
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

