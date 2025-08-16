-- Migration: Create Advanced Notifications Tables
-- Date: 2024-01-15
-- Description: Creates tables for the Advanced Notifications system

-- Create advanced_notifications table
CREATE TABLE IF NOT EXISTS `advanced_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` char(36) NOT NULL,
  `notification_type` enum('price_drop','group_buy_update','swap_offer','buyer_need_match','auction_ending','new_follower','message_received','product_viewed','search_insight','market_trend','verification_status','subscription_update','system_alert') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `delivery_methods` json NOT NULL DEFAULT '["in_app"]',
  `target_entity_type` varchar(100) DEFAULT NULL,
  `target_entity_id` varchar(255) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `is_delivered` tinyint(1) DEFAULT 0,
  `delivery_attempts` int(11) DEFAULT 0,
  `scheduled_for` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `user_preferences` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_notification_type` (`notification_type`),
  KEY `idx_priority` (`priority`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_is_delivered` (`is_delivered`),
  KEY `idx_scheduled_for` (`scheduled_for`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_target_entity` (`target_entity_type`, `target_entity_id`),
  CONSTRAINT `fk_advanced_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS `user_notification_preferences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` char(36) NOT NULL,
  `notification_type` enum('price_drop','group_buy_update','swap_offer','buyer_need_match','auction_ending','new_follower','message_received','product_viewed','search_insight','market_trend','verification_status','subscription_update','system_alert') NOT NULL,
  `is_enabled` tinyint(1) DEFAULT 1,
  `delivery_methods` json NOT NULL DEFAULT '["in_app"]',
  `priority_threshold` enum('low','medium','high','urgent') DEFAULT 'low',
  `quiet_hours_start` time DEFAULT NULL,
  `quiet_hours_end` time DEFAULT NULL,
  `timezone` varchar(50) DEFAULT 'UTC',
  `frequency_limit` int(11) DEFAULT 0,
  `category_preferences` json DEFAULT NULL,
  `location_preferences` json DEFAULT NULL,
  `price_threshold` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_notification_type` (`user_id`, `notification_type`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_notification_type` (`notification_type`),
  KEY `idx_is_enabled` (`is_enabled`),
  CONSTRAINT `fk_user_notification_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create notification_templates table
CREATE TABLE IF NOT EXISTS `notification_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template_name` varchar(100) NOT NULL,
  `notification_type` enum('price_drop','group_buy_update','swap_offer','buyer_need_match','auction_ending','new_follower','message_received','product_viewed','search_insight','market_trend','verification_status','subscription_update','system_alert') NOT NULL,
  `title_template` varchar(255) NOT NULL,
  `message_template` text NOT NULL,
  `variables` json DEFAULT NULL,
  `default_priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `default_delivery_methods` json NOT NULL DEFAULT '["in_app"]',
  `is_active` tinyint(1) DEFAULT 1,
  `version` int(11) DEFAULT 1,
  `language` varchar(10) DEFAULT 'en',
  `category` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_template_name` (`template_name`),
  KEY `idx_template_name` (`template_name`),
  KEY `idx_notification_type` (`notification_type`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_language` (`language`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default notification templates
INSERT INTO `notification_templates` (`template_name`, `notification_type`, `title_template`, `message_template`, `variables`, `default_priority`, `default_delivery_methods`, `language`, `category`) VALUES
-- Price Drop Notifications
('price_drop_alert', 'price_drop', 'Price Drop Alert: {product_name}', 'The price of {product_name} has dropped from {old_price} to {new_price}! Save {savings_amount} on your purchase.', '["product_name", "old_price", "new_price", "savings_amount"]', 'medium', '["in_app", "push"]', 'en', 'pricing'),

-- Group Buy Updates
('group_buy_update', 'group_buy_update', 'Group Buy Update: {product_name}', 'Your group buy for {product_name} now has {current_participants} participants. {participants_needed} more needed to reach the target!', '["product_name", "current_participants", "participants_needed"]', 'medium', '["in_app", "push"]', 'en', 'group_buy'),

-- Swap Offers
('swap_offer_received', 'swap_offer', 'New Swap Offer: {initiator_item} for {responder_item}', 'Someone wants to swap their {initiator_item} for your {responder_item}. Check it out!', '["initiator_item", "responder_item"]', 'high', '["in_app", "push"]', 'en', 'swap_deals'),

-- Buyer Needs Matches
('buyer_need_match', 'buyer_need_match', 'Buyer Need Match: {need_title}', 'A buyer is looking for {need_title} in your area. This matches your inventory!', '["need_title"]', 'high', '["in_app", "push"]', 'en', 'buyer_needs'),

-- Auction Ending
('auction_ending', 'auction_ending', 'Auction Ending Soon: {auction_title}', 'The auction for {auction_title} ends in {time_remaining}. Current bid: {current_bid}', '["auction_title", "time_remaining", "current_bid"]', 'urgent', '["in_app", "push", "email"]', 'en', 'auctions'),

-- New Follower
('new_follower', 'new_follower', 'New Follower: {follower_name}', '{follower_name} started following you! Check out their profile.', '["follower_name"]', 'low', '["in_app"]', 'en', 'social'),

-- Message Received
('message_received', 'message_received', 'New Message from {sender_name}', 'You have a new message from {sender_name}: {message_preview}', '["sender_name", "message_preview"]', 'medium', '["in_app", "push"]', 'en', 'messaging'),

-- Product Viewed
('product_viewed', 'product_viewed', 'Product Viewed: {product_name}', 'Your product {product_name} was viewed by {viewer_count} users today.', '["product_name", "viewer_count"]', 'low', '["in_app"]', 'en', 'analytics'),

-- Search Insights
('search_insight', 'search_insight', 'Search Insight: {search_term}', 'People in {location} are searching for {search_term}. Consider adding this to your inventory!', '["search_term", "location"]', 'medium', '["in_app"]', 'en', 'market_insights'),

-- Market Trends
('market_trend', 'market_trend', 'Market Trend: {trend_name}', 'The {trend_name} trend is gaining momentum. {trend_description}', '["trend_name", "trend_description"]', 'medium', '["in_app"]', 'en', 'market_insights'),

-- Verification Status
('verification_status', 'verification_status', 'Verification Update: {status}', 'Your seller verification status has been updated to: {status}. {additional_info}', '["status", "additional_info"]', 'high', '["in_app", "email"]', 'en', 'verification'),

-- Subscription Updates
('subscription_update', 'subscription_update', 'Subscription Update: {subscription_name}', 'Your {subscription_name} subscription will {action} on {date}. {additional_info}', '["subscription_name", "action", "date", "additional_info"]', 'medium', '["in_app", "email"]', 'en', 'subscriptions'),

-- System Alerts
('system_alert', 'system_alert', 'System Alert: {alert_title}', '{alert_message}. Please take action if required.', '["alert_title", "alert_message"]', 'urgent', '["in_app", "push", "email"]', 'en', 'system');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS `idx_advanced_notifications_user_type` ON `advanced_notifications` (`user_id`, `notification_type`);
CREATE INDEX IF NOT EXISTS `idx_advanced_notifications_priority_created` ON `advanced_notifications` (`priority`, `created_at`);
CREATE INDEX IF NOT EXISTS `idx_advanced_notifications_delivery_status` ON `advanced_notifications` (`is_delivered`, `is_read`);

CREATE INDEX IF NOT EXISTS `idx_user_preferences_enabled` ON `user_notification_preferences` (`is_enabled`, `notification_type`);
CREATE INDEX IF NOT EXISTS `idx_user_preferences_priority` ON `user_notification_preferences` (`priority_threshold`);

CREATE INDEX IF NOT EXISTS `idx_templates_type_active` ON `notification_templates` (`notification_type`, `is_active`);
CREATE INDEX IF NOT EXISTS `idx_templates_version` ON `notification_templates` (`template_name`, `version`);
