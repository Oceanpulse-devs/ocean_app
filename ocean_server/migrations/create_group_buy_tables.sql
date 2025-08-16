-- Create Group Buy Tables Migration
-- This migration creates the necessary tables for the Group Buy system

-- Create group_buys table
CREATE TABLE IF NOT EXISTS `group_buys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL COMMENT 'Title of the group buy',
  `description` text NOT NULL COMMENT 'Detailed description of the group buy',
  `category_id` int(11) NOT NULL COMMENT 'Product category for the group buy',
  `product_name` varchar(255) NOT NULL COMMENT 'Name of the product being purchased',
  `product_image` varchar(500) DEFAULT NULL COMMENT 'URL to product image',
  `original_price` decimal(10,2) NOT NULL COMMENT 'Original retail price of the product',
  `group_price` decimal(10,2) NOT NULL COMMENT 'Discounted price when group buy threshold is met',
  `min_buyers` int(11) NOT NULL DEFAULT 2 COMMENT 'Minimum number of buyers required to activate group buy',
  `max_buyers` int(11) DEFAULT NULL COMMENT 'Maximum number of buyers allowed (optional)',
  `current_buyers` int(11) DEFAULT 0 COMMENT 'Current number of committed buyers',
  `status` enum('pending','active','successful','failed','cancelled') DEFAULT 'pending' COMMENT 'Current status of the group buy',
  `creator_id` int(11) NOT NULL COMMENT 'User ID who created the group buy',
  `seller_id` int(11) DEFAULT NULL COMMENT 'Seller ID if a specific seller is involved',
  `location` varchar(255) DEFAULT NULL COMMENT 'Location for pickup/delivery',
  `deadline` datetime NOT NULL COMMENT 'Deadline for joining the group buy',
  `delivery_date` datetime DEFAULT NULL COMMENT 'Expected delivery date when successful',
  `terms_conditions` text DEFAULT NULL COMMENT 'Terms and conditions for the group buy',
  `tags` json DEFAULT NULL COMMENT 'Array of tags for categorization',
  `is_featured` tinyint(1) DEFAULT 0 COMMENT 'Whether this group buy is featured',
  `views_count` int(11) DEFAULT 0 COMMENT 'Number of views on this group buy',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_status` (`status`),
  KEY `idx_deadline` (`deadline`),
  KEY `idx_is_featured` (`is_featured`),
  CONSTRAINT `fk_group_buy_category` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_group_buy_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_group_buy_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Group Buy listings table';

-- Create group_buy_participants table
CREATE TABLE IF NOT EXISTS `group_buy_participants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_buy_id` int(11) NOT NULL COMMENT 'ID of the group buy',
  `user_id` int(11) NOT NULL COMMENT 'ID of the user joining the group buy',
  `quantity` int(11) NOT NULL DEFAULT 1 COMMENT 'Quantity of items the user wants to buy',
  `status` enum('pending','confirmed','cancelled','completed') DEFAULT 'pending' COMMENT 'Status of the user''s participation',
  `payment_status` enum('pending','paid','refunded') DEFAULT 'pending' COMMENT 'Payment status for this participation',
  `payment_method` varchar(100) DEFAULT NULL COMMENT 'Payment method used',
  `payment_reference` varchar(255) DEFAULT NULL COMMENT 'Payment reference number',
  `total_amount` decimal(10,2) NOT NULL COMMENT 'Total amount for this participation (quantity * group_price)',
  `pickup_location` varchar(255) DEFAULT NULL COMMENT 'Preferred pickup location for this user',
  `delivery_address` text DEFAULT NULL COMMENT 'Delivery address if delivery is preferred',
  `special_requests` text DEFAULT NULL COMMENT 'Any special requests from the user',
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the user joined the group buy',
  `confirmed_at` timestamp NULL DEFAULT NULL COMMENT 'When the participation was confirmed',
  `cancelled_at` timestamp NULL DEFAULT NULL COMMENT 'When the participation was cancelled',
  `completed_at` timestamp NULL DEFAULT NULL COMMENT 'When the participation was completed',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_buy_user` (`group_buy_id`, `user_id`),
  KEY `idx_group_buy_id` (`group_buy_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_payment_status` (`payment_status`),
  CONSTRAINT `fk_participant_group_buy` FOREIGN KEY (`group_buy_id`) REFERENCES `group_buys` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_participant_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Group Buy participants table';

-- Insert sample data for testing (optional)
-- INSERT INTO `group_buys` (`title`, `description`, `category_id`, `product_name`, `original_price`, `group_price`, `min_buyers`, `creator_id`, `deadline`) VALUES
-- ('iPhone 15 Pro Group Buy', 'Get the latest iPhone 15 Pro at a discounted group rate!', 1, 'iPhone 15 Pro', 999.99, 899.99, 5, 1, DATE_ADD(NOW(), INTERVAL 30 DAY)),
-- ('MacBook Air M2 Group Buy', 'High-performance MacBook Air with M2 chip at group discount', 1, 'MacBook Air M2', 1199.99, 1099.99, 3, 1, DATE_ADD(NOW(), INTERVAL 21 DAY));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS `idx_group_buy_created_at` ON `group_buys` (`created_at`);
CREATE INDEX IF NOT EXISTS `idx_group_buy_price_range` ON `group_buys` (`group_price`);
CREATE INDEX IF NOT EXISTS `idx_participant_joined_at` ON `group_buy_participants` (`joined_at`);
