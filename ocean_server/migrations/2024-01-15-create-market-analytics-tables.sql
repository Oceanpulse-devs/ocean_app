-- Create Market Analytics Tables Migration
-- This migration creates the necessary tables for the comprehensive Market Analytics system

-- Create market_analytics table
CREATE TABLE IF NOT EXISTS `market_analytics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `metric_type` enum('product_views','search_queries','category_trends','price_analysis','user_engagement','market_volume','conversion_rates','geographic_distribution') NOT NULL COMMENT 'Type of market metric being tracked',
  `metric_name` varchar(255) NOT NULL COMMENT 'Specific name of the metric',
  `metric_value` decimal(15,4) NOT NULL COMMENT 'Numeric value of the metric',
  `metric_unit` varchar(50) DEFAULT NULL COMMENT 'Unit of measurement for the metric',
  `category_id` char(36) DEFAULT NULL COMMENT 'Product category this metric relates to (if applicable)',
  `location` varchar(255) DEFAULT NULL COMMENT 'Geographic location this metric relates to (if applicable)',
  `time_period` enum('hourly','daily','weekly','monthly','quarterly','yearly') NOT NULL COMMENT 'Time period for the metric aggregation',
  `period_start` datetime NOT NULL COMMENT 'Start of the time period',
  `period_end` datetime NOT NULL COMMENT 'End of the time period',
  `comparison_value` decimal(15,4) DEFAULT NULL COMMENT 'Previous period value for comparison',
  `change_percentage` decimal(5,2) DEFAULT NULL COMMENT 'Percentage change from previous period',
  `trend_direction` enum('increasing','decreasing','stable','fluctuating') DEFAULT NULL COMMENT 'Overall trend direction',
  `confidence_level` decimal(3,2) DEFAULT NULL COMMENT 'Confidence level in the metric (0.00 to 1.00)',
  `metadata` json DEFAULT NULL COMMENT 'Additional metadata and context for the metric',
  `is_forecast` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this is a forecasted/predicted value',
  `forecast_accuracy` decimal(3,2) DEFAULT NULL COMMENT 'Accuracy of previous forecasts (0.00 to 1.00)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_metric_type` (`metric_type`),
  KEY `idx_metric_name` (`metric_name`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_location` (`location`),
  KEY `idx_time_period` (`time_period`),
  KEY `idx_period_start` (`period_start`),
  KEY `idx_period_end` (`period_end`),
  KEY `idx_trend_direction` (`trend_direction`),
  KEY `idx_is_forecast` (`is_forecast`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_market_analytics_category` FOREIGN KEY (`category_id`) REFERENCES `productcategories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Market Analytics metrics table';

-- Create search_analytics table
CREATE TABLE IF NOT EXISTS `search_analytics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `search_query` varchar(500) NOT NULL COMMENT 'The actual search query text',
  `search_type` enum('product','user','category','general') NOT NULL COMMENT 'Type of search performed',
  `user_id` char(36) DEFAULT NULL COMMENT 'User ID who performed the search (if logged in)',
  `category_id` char(36) DEFAULT NULL COMMENT 'Category being searched (if applicable)',
  `location` varchar(255) DEFAULT NULL COMMENT 'User location when search was performed',
  `device_type` enum('mobile','desktop','tablet') DEFAULT NULL COMMENT 'Device type used for search',
  `results_count` int(11) DEFAULT NULL COMMENT 'Number of results returned',
  `click_position` int(11) DEFAULT NULL COMMENT 'Position of clicked result (1-based)',
  `time_spent` int(11) DEFAULT NULL COMMENT 'Time spent on search results (seconds)',
  `is_successful` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether search led to a successful action',
  `success_action` enum('view','purchase','contact','save','share') DEFAULT NULL COMMENT 'Type of successful action taken',
  `search_filters` json DEFAULT NULL COMMENT 'Filters applied during search (price, location, etc.)',
  `search_suggestions` json DEFAULT NULL COMMENT 'Search suggestions shown to user',
  `search_session_id` varchar(255) DEFAULT NULL COMMENT 'Unique session identifier for search analytics',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_search_query` (`search_query`),
  KEY `idx_search_type` (`search_type`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_location` (`location`),
  KEY `idx_device_type` (`device_type`),
  KEY `idx_is_successful` (`is_successful`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_search_session_id` (`search_session_id`),
  CONSTRAINT `fk_search_analytics_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_search_analytics_category` FOREIGN KEY (`category_id`) REFERENCES `productcategories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Search Analytics and user search behavior';

-- Create user_behavior_analytics table
CREATE TABLE IF NOT EXISTS `user_behavior_analytics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` char(36) DEFAULT NULL COMMENT 'User ID (null for anonymous users)',
  `session_id` varchar(255) NOT NULL COMMENT 'Unique session identifier',
  `behavior_type` enum('page_view','product_interaction','auction_participation','group_buy_activity','swap_deal_activity','buyer_need_activity','messaging_activity','social_interaction','purchase_behavior','search_behavior') NOT NULL COMMENT 'Type of user behavior being tracked',
  `action` varchar(255) NOT NULL COMMENT 'Specific action performed',
  `target_id` varchar(255) DEFAULT NULL COMMENT 'ID of the target object (product, post, etc.)',
  `target_type` varchar(100) DEFAULT NULL COMMENT 'Type of target object',
  `duration` int(11) DEFAULT NULL COMMENT 'Duration of interaction in seconds',
  `location` varchar(255) DEFAULT NULL COMMENT 'User location when action was performed',
  `device_type` enum('mobile','desktop','tablet') DEFAULT NULL COMMENT 'Device type used',
  `browser` varchar(100) DEFAULT NULL COMMENT 'Browser used',
  `os` varchar(100) DEFAULT NULL COMMENT 'Operating system',
  `referrer` varchar(500) DEFAULT NULL COMMENT 'Referrer URL',
  `user_agent` text DEFAULT NULL COMMENT 'Full user agent string',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'User IP address',
  `context_data` json DEFAULT NULL COMMENT 'Additional context data for the behavior',
  `conversion_value` decimal(10,2) DEFAULT NULL COMMENT 'Monetary value if action led to conversion',
  `is_conversion` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this action led to a conversion',
  `funnel_stage` enum('awareness','interest','consideration','intent','purchase','retention') DEFAULT NULL COMMENT 'Stage in the user funnel',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_behavior_type` (`behavior_type`),
  KEY `idx_action` (`action`),
  KEY `idx_target_type` (`target_type`),
  KEY `idx_location` (`location`),
  KEY `idx_device_type` (`device_type`),
  KEY `idx_is_conversion` (`is_conversion`),
  KEY `idx_funnel_stage` (`funnel_stage`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_user_behavior_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User Behavior Analytics and interaction tracking';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS `idx_market_analytics_period_range` ON `market_analytics` (`period_start`, `period_end`);
CREATE INDEX IF NOT EXISTS `idx_market_analytics_metric_value` ON `market_analytics` (`metric_value`);
CREATE INDEX IF NOT EXISTS `idx_market_analytics_change_percentage` ON `market_analytics` (`change_percentage`);
CREATE INDEX IF NOT EXISTS `idx_search_analytics_query_time` ON `search_analytics` (`search_query`, `created_at`);
CREATE INDEX IF NOT EXISTS `idx_search_analytics_user_session` ON `search_analytics` (`user_id`, `search_session_id`);
CREATE INDEX IF NOT EXISTS `idx_user_behavior_session_time` ON `user_behavior_analytics` (`session_id`, `created_at`);
CREATE INDEX IF NOT EXISTS `idx_user_behavior_target` ON `user_behavior_analytics` (`target_type`, `target_id`);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS `idx_market_analytics_type_period` ON `market_analytics` (`metric_type`, `time_period`);
CREATE INDEX IF NOT EXISTS `idx_search_analytics_type_device` ON `search_analytics` (`search_type`, `device_type`);
CREATE INDEX IF NOT EXISTS `idx_user_behavior_type_stage` ON `user_behavior_analytics` (`behavior_type`, `funnel_stage`);
