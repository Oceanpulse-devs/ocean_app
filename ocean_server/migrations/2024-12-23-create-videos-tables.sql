-- =====================================================
-- VIDEOS TABLES MIGRATION
-- =====================================================
-- This migration creates the necessary tables for the video feed system
-- Supports TikTok-style vertical video feed with CTA functionality
-- =====================================================

-- Create videos table
CREATE TABLE IF NOT EXISTS `videos` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'UUID primary key',
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'User ID who posted this video',
  `video_url` varchar(500) NOT NULL COMMENT 'URL/path to the video file',
  `thumbnail_url` varchar(500) DEFAULT NULL COMMENT 'URL/path to the video thumbnail',
  `description` text DEFAULT NULL COMMENT 'Video description/caption',
  `cta_enabled` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Whether CTA button is enabled',
  `cta_type` enum('message_seller','call_seller','message_buyer','none') NOT NULL DEFAULT 'none' COMMENT 'Type of call-to-action',
  `cta_label` varchar(100) DEFAULT NULL COMMENT 'Display label for CTA button',
  `video_role` enum('seller','buyer') NOT NULL DEFAULT 'seller' COMMENT 'Role of the video creator (seller or buyer)',
  `duration` int(11) DEFAULT NULL COMMENT 'Video duration in seconds',
  `file_size` bigint(20) DEFAULT NULL COMMENT 'Video file size in bytes',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'Video MIME type (e.g., video/mp4)',
  `like_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of likes on this video',
  `comment_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of comments on this video',
  `share_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of shares',
  `views_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of views',
  `is_sponsored` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this is a sponsored video',
  `status` enum('active','inactive','deleted') NOT NULL DEFAULT 'active' COMMENT 'Video status',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_video_role` (`video_role`),
  KEY `idx_cta_type` (`cta_type`),
  KEY `idx_is_sponsored` (`is_sponsored`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_like_count` (`like_count`),
  KEY `idx_views_count` (`views_count`),
  CONSTRAINT `fk_video_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Videos table for TikTok-style video feed';

-- Create video_likes table for tracking user likes
CREATE TABLE IF NOT EXISTS `video_likes` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'UUID primary key',
  `video_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ID of the video being liked',
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'User ID who liked the video',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_video_user_like` (`video_id`, `user_id`),
  KEY `idx_video_id` (`video_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_video_like_video` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_video_like_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Video likes tracking table';

-- Create video_views table for tracking individual video views
-- This allows for analytics and prevents duplicate view counting
CREATE TABLE IF NOT EXISTS `video_views` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'UUID primary key',
  `video_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ID of the video being viewed',
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'User ID who viewed (NULL for anonymous views)',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP address for anonymous view tracking',
  `viewed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_video_id` (`video_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_viewed_at` (`viewed_at`),
  KEY `idx_video_user_view` (`video_id`, `user_id`),
  CONSTRAINT `fk_video_view_video` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_video_view_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Video views tracking table';

-- Create video_comments table for video comments
-- Note: You may want to use an existing comments system if you have one
CREATE TABLE IF NOT EXISTS `video_comments` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'UUID primary key',
  `video_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ID of the video being commented on',
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'User ID who made the comment',
  `comment` text NOT NULL COMMENT 'Comment text',
  `parent_comment_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'ID of parent comment for nested replies',
  `like_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of likes on this comment',
  `status` enum('active','deleted','hidden') NOT NULL DEFAULT 'active' COMMENT 'Comment status',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_video_id` (`video_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_parent_comment_id` (`parent_comment_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_video_comment_video` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_video_comment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_video_comment_parent` FOREIGN KEY (`parent_comment_id`) REFERENCES `video_comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Video comments table';

-- Create video_comment_likes table for comment likes
CREATE TABLE IF NOT EXISTS `video_comment_likes` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'UUID primary key',
  `comment_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'ID of the comment being liked',
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'User ID who liked the comment',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_comment_user_like` (`comment_id`, `user_id`),
  KEY `idx_comment_id` (`comment_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_comment_like_comment` FOREIGN KEY (`comment_id`) REFERENCES `video_comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_like_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Video comment likes tracking table';

-- =====================================================
-- TRIGGERS FOR AUTOMATIC COUNTER UPDATES
-- =====================================================

DELIMITER $$

-- Trigger to update video like_count when a like is added
DROP TRIGGER IF EXISTS `tr_video_like_insert`$$
CREATE TRIGGER `tr_video_like_insert`
AFTER INSERT ON `video_likes`
FOR EACH ROW
BEGIN
    UPDATE `videos`
    SET `like_count` = `like_count` + 1
    WHERE `id` = NEW.video_id;
END$$

-- Trigger to update video like_count when a like is removed
DROP TRIGGER IF EXISTS `tr_video_like_delete`$$
CREATE TRIGGER `tr_video_like_delete`
AFTER DELETE ON `video_likes`
FOR EACH ROW
BEGIN
    UPDATE `videos`
    SET `like_count` = GREATEST(`like_count` - 1, 0)
    WHERE `id` = OLD.video_id;
END$$

-- Trigger to update video comment_count when a comment is added
DROP TRIGGER IF EXISTS `tr_video_comment_insert`$$
CREATE TRIGGER `tr_video_comment_insert`
AFTER INSERT ON `video_comments`
FOR EACH ROW
BEGIN
    IF NEW.status = 'active' THEN
        UPDATE `videos`
        SET `comment_count` = `comment_count` + 1
        WHERE `id` = NEW.video_id;
    END IF;
END$$

-- Trigger to update video comment_count when a comment is deleted
DROP TRIGGER IF EXISTS `tr_video_comment_delete`$$
CREATE TRIGGER `tr_video_comment_delete`
AFTER UPDATE ON `video_comments`
FOR EACH ROW
BEGIN
    IF OLD.status = 'active' AND NEW.status = 'deleted' THEN
        UPDATE `videos`
        SET `comment_count` = GREATEST(`comment_count` - 1, 0)
        WHERE `id` = NEW.video_id;
    END IF;
END$$

-- Trigger to update video views_count when a view is added
-- Note: This increments on every view insert. You may want to add logic
-- to prevent duplicate views from the same user/IP within a time window
DROP TRIGGER IF EXISTS `tr_video_view_insert`$$
CREATE TRIGGER `tr_video_view_insert`
AFTER INSERT ON `video_views`
FOR EACH ROW
BEGIN
    UPDATE `videos`
    SET `views_count` = `views_count` + 1
    WHERE `id` = NEW.video_id;
END$$

-- Trigger to update comment like_count when a comment like is added
DROP TRIGGER IF EXISTS `tr_video_comment_like_insert`$$
CREATE TRIGGER `tr_video_comment_like_insert`
AFTER INSERT ON `video_comment_likes`
FOR EACH ROW
BEGIN
    UPDATE `video_comments`
    SET `like_count` = `like_count` + 1
    WHERE `id` = NEW.comment_id;
END$$

-- Trigger to update comment like_count when a comment like is removed
DROP TRIGGER IF EXISTS `tr_video_comment_like_delete`$$
CREATE TRIGGER `tr_video_comment_like_delete`
AFTER DELETE ON `video_comment_likes`
FOR EACH ROW
BEGIN
    UPDATE `video_comments`
    SET `like_count` = GREATEST(`like_count` - 1, 0)
    WHERE `id` = OLD.comment_id;
END$$

DELIMITER ;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

