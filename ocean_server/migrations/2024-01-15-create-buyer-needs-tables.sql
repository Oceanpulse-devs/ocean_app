-- Create Buyer Needs Board Tables Migration
-- This migration creates the necessary tables for the Buyer Needs Board system

-- Create buyer_needs table
CREATE TABLE IF NOT EXISTS `buyer_needs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL COMMENT 'Title describing what the buyer is looking for',
  `description` text NOT NULL COMMENT 'Detailed description of the item/service needed',
  `buyer_id` char(36) NOT NULL COMMENT 'User ID who posted this buyer need',
  `category_id` char(36) DEFAULT NULL COMMENT 'Product category for the buyer need (optional)',
  `budget_min` decimal(10,2) DEFAULT NULL COMMENT 'Minimum budget range',
  `budget_max` decimal(10,2) DEFAULT NULL COMMENT 'Maximum budget range',
  `currency` varchar(3) NOT NULL DEFAULT 'USD' COMMENT 'Currency for budget amounts',
  `location` varchar(255) DEFAULT NULL COMMENT 'Preferred location for pickup/delivery',
  `urgency` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium' COMMENT 'How urgently the buyer needs this item',
  `status` enum('active','in_progress','fulfilled','expired','cancelled') NOT NULL DEFAULT 'active' COMMENT 'Current status of the buyer need',
  `is_featured` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this buyer need is featured',
  `views_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of views on this buyer need',
  `responses_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of seller responses received',
  `expires_at` datetime NOT NULL COMMENT 'When this buyer need expires',
  `tags` json DEFAULT NULL COMMENT 'Array of tags for categorization and search',
  `contact_preference` enum('message','email','phone','any') NOT NULL DEFAULT 'message' COMMENT 'Preferred contact method for sellers',
  `additional_requirements` text DEFAULT NULL COMMENT 'Any additional requirements or preferences',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_buyer_id` (`buyer_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_urgency` (`urgency`),
  KEY `idx_is_featured` (`is_featured`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_buyer_need_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_buyer_need_category` FOREIGN KEY (`category_id`) REFERENCES `productcategories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Buyer Needs Board table';

-- Create buyer_need_responses table
CREATE TABLE IF NOT EXISTS `buyer_need_responses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `buyer_need_id` int(11) NOT NULL COMMENT 'ID of the buyer need being responded to',
  `seller_id` char(36) NOT NULL COMMENT 'User ID of the seller responding',
  `message` text NOT NULL COMMENT 'Seller''s response message to the buyer need',
  `offer_price` decimal(10,2) DEFAULT NULL COMMENT 'Price offered by the seller (if applicable)',
  `currency` varchar(3) NOT NULL DEFAULT 'USD' COMMENT 'Currency for the offer price',
  `status` enum('pending','accepted','rejected','expired','withdrawn') NOT NULL DEFAULT 'pending' COMMENT 'Status of the seller response',
  `is_featured` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this response is featured',
  `response_type` enum('offer','inquiry','suggestion','other') NOT NULL DEFAULT 'offer' COMMENT 'Type of response from seller',
  `delivery_time` varchar(100) DEFAULT NULL COMMENT 'Estimated delivery time offered by seller',
  `warranty_info` text DEFAULT NULL COMMENT 'Warranty information if applicable',
  `return_policy` text DEFAULT NULL COMMENT 'Return policy if applicable',
  `contact_method` enum('message','email','phone','meet') NOT NULL COMMENT 'Preferred contact method for this response',
  `is_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether the buyer has read this response',
  `buyer_feedback` enum('positive','neutral','negative') DEFAULT NULL COMMENT 'Buyer feedback on this response',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_buyer_need_seller` (`buyer_need_id`, `seller_id`),
  KEY `idx_buyer_need_id` (`buyer_need_id`),
  KEY `idx_seller_id` (`seller_id`),
  KEY `idx_status` (`status`),
  KEY `idx_is_featured` (`is_featured`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_response_buyer_need` FOREIGN KEY (`buyer_need_id`) REFERENCES `buyer_needs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_response_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Seller responses to buyer needs';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS `idx_buyer_need_budget_range` ON `buyer_needs` (`budget_min`, `budget_max`);
CREATE INDEX IF NOT EXISTS `idx_buyer_need_location` ON `buyer_needs` (`location`);
CREATE INDEX IF NOT EXISTS `idx_buyer_need_tags` ON `buyer_needs` ((CAST(tags AS CHAR(1000))));
CREATE INDEX IF NOT EXISTS `idx_response_offer_price` ON `buyer_need_responses` (`offer_price`);
CREATE INDEX IF NOT EXISTS `idx_response_type` ON `buyer_need_responses` (`response_type`);
