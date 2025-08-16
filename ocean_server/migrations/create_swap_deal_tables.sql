-- Create Swap Deals Tables Migration
-- This migration creates the necessary tables for the Swap Deals system

-- Create swap_deals table
CREATE TABLE IF NOT EXISTS `swap_deals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL COMMENT 'Title of the swap deal',
  `description` text NOT NULL COMMENT 'Detailed description of the swap deal',
  `initiator_id` int(11) NOT NULL COMMENT 'User ID who initiated the swap offer',
  `responder_id` int(11) NOT NULL COMMENT 'User ID who received the swap offer',
  `initiator_item_id` int(11) NOT NULL COMMENT 'Product ID of the item offered by initiator',
  `responder_item_id` int(11) NOT NULL COMMENT 'Product ID of the item offered by responder',
  `status` enum('pending','accepted','rejected','cancelled','completed') DEFAULT 'pending' COMMENT 'Current status of the swap deal',
  `initiator_approval` tinyint(1) DEFAULT 0 COMMENT 'Whether initiator has approved the swap',
  `responder_approval` tinyint(1) DEFAULT 0 COMMENT 'Whether responder has approved the swap',
  `swap_terms` text DEFAULT NULL COMMENT 'Additional terms or conditions for the swap',
  `meeting_location` varchar(255) DEFAULT NULL COMMENT 'Preferred meeting location for item exchange',
  `meeting_date` datetime DEFAULT NULL COMMENT 'Preferred meeting date for item exchange',
  `initiator_message` text DEFAULT NULL COMMENT 'Message from initiator explaining the swap offer',
  `responder_message` text DEFAULT NULL COMMENT 'Message from responder about the swap offer',
  `is_featured` tinyint(1) DEFAULT 0 COMMENT 'Whether this swap deal is featured',
  `views_count` int(11) DEFAULT 0 COMMENT 'Number of views on this swap deal',
  `expires_at` datetime DEFAULT NULL COMMENT 'When the swap offer expires',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_initiator_id` (`initiator_id`),
  KEY `idx_responder_id` (`responder_id`),
  KEY `idx_status` (`status`),
  KEY `idx_initiator_item_id` (`initiator_item_id`),
  KEY `idx_responder_item_id` (`responder_item_id`),
  KEY `idx_is_featured` (`is_featured`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `fk_swap_deal_initiator` FOREIGN KEY (`initiator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_swap_deal_responder` FOREIGN KEY (`responder_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_swap_deal_initiator_item` FOREIGN KEY (`initiator_item_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_swap_deal_responder_item` FOREIGN KEY (`responder_item_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Swap Deals table';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS `idx_swap_deal_created_at` ON `swap_deals` (`created_at`);
CREATE INDEX IF NOT EXISTS `idx_swap_deal_updated_at` ON `swap_deals` (`updated_at`);

-- Insert sample data for testing (optional)
-- INSERT INTO `swap_deals` (`title`, `description`, `initiator_id`, `responder_id`, `initiator_item_id`, `responder_item_id`, `initiator_message`) VALUES
-- ('iPhone for Samsung Swap', 'Looking to swap my iPhone 12 for a Samsung Galaxy S21', 1, 2, 1, 2, 'Hi! I would like to swap my iPhone 12 for your Samsung Galaxy S21. Both phones are in excellent condition.'),
-- ('MacBook for Gaming Laptop Swap', 'Want to swap my MacBook Air for a gaming laptop', 1, 3, 3, 4, 'I am looking for a gaming laptop and willing to swap my MacBook Air M1. Let me know if you are interested!');
