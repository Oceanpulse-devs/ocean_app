-- =============================================
-- SUBSCRIPTION SYSTEM MIGRATION
-- Created: 2024-01-20
-- Description: Creates complete subscription system with plans, usage tracking, and promotional boosts
-- =============================================

-- 1. Subscription Plans Table
CREATE TABLE subscription_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Plan identifier (drift, wave, tide, surge)',
  display_name VARCHAR(100) NOT NULL COMMENT 'Human-readable plan name',
  price DECIMAL(10,2) NOT NULL COMMENT 'Price in NGN',
  currency VARCHAR(3) DEFAULT 'NGN',
  billing_period ENUM('monthly', 'yearly') DEFAULT 'monthly',
  
  -- Feature Limits
  max_listings INT NOT NULL DEFAULT 0 COMMENT 'Maximum product listings allowed',
  max_group_buys INT NOT NULL DEFAULT 0 COMMENT 'Maximum group buys can create',
  max_swap_deals INT NOT NULL DEFAULT 0 COMMENT 'Maximum swap deals can create',
  max_auctions INT NOT NULL DEFAULT 0 COMMENT 'Maximum auctions can create',
  max_distress_sales INT NOT NULL DEFAULT 0 COMMENT 'Maximum distress sales can create',
  max_daily_dms INT NOT NULL DEFAULT 0 COMMENT 'Maximum DMs per day',
  max_daily_notifications INT NOT NULL DEFAULT 0 COMMENT 'Maximum notifications per day',
  max_ar_products INT NOT NULL DEFAULT 0 COMMENT 'Maximum AR products can use',
  max_promotional_boosts INT NOT NULL DEFAULT 0 COMMENT 'Maximum promotional boosts per month',
  
  -- Feature Flags
  can_create_group_buy BOOLEAN DEFAULT FALSE COMMENT 'Can create group buy posts',
  can_create_swap_deals BOOLEAN DEFAULT FALSE COMMENT 'Can create swap deals',
  can_create_auctions BOOLEAN DEFAULT FALSE COMMENT 'Can create auctions',
  can_create_distress_sales BOOLEAN DEFAULT FALSE COMMENT 'Can create distress sales',
  can_use_ar BOOLEAN DEFAULT FALSE COMMENT 'Can use AR features',
  can_customize_shopfront BOOLEAN DEFAULT FALSE COMMENT 'Can customize shopfront',
  has_verified_badge BOOLEAN DEFAULT FALSE COMMENT 'Gets verified seller badge',
  has_priority_search BOOLEAN DEFAULT FALSE COMMENT 'Priority in search results',
  has_buyer_insights BOOLEAN DEFAULT FALSE COMMENT 'Access to buyer search insights',
  has_unlimited_features BOOLEAN DEFAULT FALSE COMMENT 'Unlimited access to all features',
  
  -- Additional Features
  features JSON COMMENT 'Array of additional features and benefits',
  description TEXT COMMENT 'Plan description',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether plan is available for subscription',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_name (name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. User Subscriptions Table
CREATE TABLE user_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL COMMENT 'Reference to users table (UUID as CHAR)',
  plan_id INT NOT NULL COMMENT 'Reference to subscription_plans table',
  status ENUM('active', 'expired', 'cancelled', 'pending', 'suspended') DEFAULT 'pending',
  start_date TIMESTAMP NOT NULL COMMENT 'Subscription start date',
  end_date TIMESTAMP NOT NULL COMMENT 'Subscription end date',
  auto_renew BOOLEAN DEFAULT TRUE COMMENT 'Auto-renew subscription',
  payment_reference VARCHAR(255) COMMENT 'Payment gateway reference',
  payment_method VARCHAR(50) COMMENT 'Payment method used',
  amount_paid DECIMAL(10,2) COMMENT 'Amount paid for this subscription',
  currency VARCHAR(3) DEFAULT 'NGN',
  cancellation_reason TEXT COMMENT 'Reason for cancellation',
  cancelled_at TIMESTAMP NULL COMMENT 'When subscription was cancelled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_end_date (end_date),
  INDEX idx_payment_reference (payment_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Subscription Usage Tracking Table
CREATE TABLE subscription_usage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL COMMENT 'Reference to users table (UUID as CHAR)',
  subscription_id INT NOT NULL COMMENT 'Reference to user_subscriptions table',
  usage_period DATE NOT NULL COMMENT 'Date for daily usage tracking',
  
  -- Daily Usage Counters
  listings_created INT DEFAULT 0 COMMENT 'Products created today',
  group_buys_created INT DEFAULT 0 COMMENT 'Group buys created today',
  swap_deals_created INT DEFAULT 0 COMMENT 'Swap deals created today',
  auctions_created INT DEFAULT 0 COMMENT 'Auctions created today',
  distress_sales_created INT DEFAULT 0 COMMENT 'Distress sales created today',
  dms_sent INT DEFAULT 0 COMMENT 'DMs sent today',
  notifications_received INT DEFAULT 0 COMMENT 'Notifications received today',
  ar_products_used INT DEFAULT 0 COMMENT 'AR products used today',
  promotional_boosts_used INT DEFAULT 0 COMMENT 'Promotional boosts used today',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_period (user_id, usage_period),
  INDEX idx_usage_period (usage_period),
  INDEX idx_subscription_id (subscription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Promotional Boosts Table
CREATE TABLE promotional_boosts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL COMMENT 'Reference to users table (UUID as CHAR)',
  subscription_id INT NOT NULL COMMENT 'Reference to user_subscriptions table',
  boost_type ENUM('product', 'group_buy', 'swap_deal', 'auction', 'buyer_need') NOT NULL,
  target_id CHAR(36) NOT NULL COMMENT 'ID of the item being boosted (UUID as CHAR)',
  boost_duration_hours INT DEFAULT 24 COMMENT 'Duration in hours',
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  start_time TIMESTAMP NOT NULL COMMENT 'When boost starts',
  end_time TIMESTAMP NOT NULL COMMENT 'When boost ends',
  boost_reason VARCHAR(255) COMMENT 'Reason for boost',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_boost_type (boost_type),
  INDEX idx_target_id (target_id),
  INDEX idx_status (status),
  INDEX idx_end_time (end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- INSERT DEFAULT SUBSCRIPTION PLANS
-- =============================================

-- Drift Plan (₦1,500/month) - Startup
INSERT INTO subscription_plans (
  name, display_name, price, currency, billing_period,
  max_listings, max_group_buys, max_swap_deals, max_auctions, max_distress_sales,
  max_daily_dms, max_daily_notifications, max_ar_products, max_promotional_boosts,
  can_create_group_buy, can_create_swap_deals, can_create_auctions, can_create_distress_sales,
  can_use_ar, can_customize_shopfront, has_verified_badge, has_priority_search,
  has_buyer_insights, has_unlimited_features, features, description
) VALUES (
  'drift', 'Drift', 1500.00, 'NGN', 'monthly',
  2, 0, 0, 0, 0,
  1, 0, 0, 0,
  FALSE, FALSE, FALSE, FALSE,
  FALSE, FALSE, FALSE, FALSE,
  FALSE, FALSE, 
  JSON_ARRAY('Basic chat with buyers', 'Join group buys', 'Very limited exposure in search'),
  'Perfect for new sellers getting started. Basic features with limited exposure.'
);

-- Wave Plan (₦3,000/month) - Basic
INSERT INTO subscription_plans (
  name, display_name, price, currency, billing_period,
  max_listings, max_group_buys, max_swap_deals, max_auctions, max_distress_sales,
  max_daily_dms, max_daily_notifications, max_ar_products, max_promotional_boosts,
  can_create_group_buy, can_create_swap_deals, can_create_auctions, can_create_distress_sales,
  can_use_ar, can_customize_shopfront, has_verified_badge, has_priority_search,
  has_buyer_insights, has_unlimited_features, features, description
) VALUES (
  'wave', 'Wave', 3000.00, 'NGN', 'monthly',
  5, 1, 1, 1, 4,
  4, 1, 0, 1,
  TRUE, TRUE, TRUE, TRUE,
  FALSE, FALSE, FALSE, TRUE,
  FALSE, FALSE,
  JSON_ARRAY('Highlighted in searches', 'Create 1 group buy post', '1 free promotional boost per month'),
  'Great for growing sellers. More listings and basic promotional features.'
);

-- Tide Plan (₦5,500/month) - Business
INSERT INTO subscription_plans (
  name, display_name, price, currency, billing_period,
  max_listings, max_group_buys, max_swap_deals, max_auctions, max_distress_sales,
  max_daily_dms, max_daily_notifications, max_ar_products, max_promotional_boosts,
  can_create_group_buy, can_create_swap_deals, can_create_auctions, can_create_distress_sales,
  can_use_ar, can_customize_shopfront, has_verified_badge, has_priority_search,
  has_buyer_insights, has_unlimited_features, features, description
) VALUES (
  'tide', 'Tide', 5500.00, 'NGN', 'monthly',
  100, 10, 10, 10, 10,
  20, 20, 20, 3,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE, TRUE,
  FALSE, FALSE,
  JSON_ARRAY('Verified Seller Badge', 'Shopfront customization', 'AR for 20 products', 'Sale insights'),
  'Perfect for business owners. Advanced features with verified badge and analytics.'
);

-- Surge Plan (₦7,000/month) - Enterprise
INSERT INTO subscription_plans (
  name, display_name, price, currency, billing_period,
  max_listings, max_group_buys, max_swap_deals, max_auctions, max_distress_sales,
  max_daily_dms, max_daily_notifications, max_ar_products, max_promotional_boosts,
  can_create_group_buy, can_create_swap_deals, can_create_auctions, can_create_distress_sales,
  can_use_ar, can_customize_shopfront, has_verified_badge, has_priority_search,
  has_buyer_insights, has_unlimited_features, features, description
) VALUES (
  'surge', 'Surge', 7000.00, 'NGN', 'monthly',
  999999, 999999, 999999, 999999, 999999,
  999999, 999999, 999999, 999999,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE,
  JSON_ARRAY('Everything unlimited', 'Top ranking in search & feeds', 'All products promotional boost', 'Top priority customer service', 'Access to buyer search insights'),
  'Ultimate plan for serious sellers. Everything unlimited with premium support.'
);

-- =============================================
-- ADD SUBSCRIPTION FIELDS TO EXISTING TABLES
-- =============================================

-- Add subscription fields to users table
ALTER TABLE users 
ADD COLUMN subscription_status ENUM('free', 'active', 'expired', 'cancelled') DEFAULT 'free' COMMENT 'Current subscription status',
ADD COLUMN current_plan_id INT NULL COMMENT 'Current active subscription plan',
ADD COLUMN subscription_expires_at TIMESTAMP NULL COMMENT 'When current subscription expires',
ADD INDEX idx_subscription_status (subscription_status),
ADD INDEX idx_current_plan_id (current_plan_id);

-- Add subscription fields to sellers table
ALTER TABLE sellers 
ADD COLUMN subscription_plan_id INT NULL COMMENT 'Current subscription plan for seller',
ADD COLUMN subscription_features JSON DEFAULT NULL COMMENT 'Active subscription features',
ADD INDEX idx_subscription_plan_id (subscription_plan_id);

-- Add boost fields to products table
ALTER TABLE products 
ADD COLUMN is_boosted BOOLEAN DEFAULT FALSE COMMENT 'Whether product is currently boosted',
ADD COLUMN boost_expires_at TIMESTAMP NULL COMMENT 'When boost expires',
ADD COLUMN boost_id INT NULL COMMENT 'Reference to promotional boost',
ADD INDEX idx_is_boosted (is_boosted),
ADD INDEX idx_boost_expires_at (boost_expires_at);

-- Add boost fields to group_buys table
ALTER TABLE group_buys 
ADD COLUMN is_boosted BOOLEAN DEFAULT FALSE COMMENT 'Whether group buy is currently boosted',
ADD COLUMN boost_expires_at TIMESTAMP NULL COMMENT 'When boost expires',
ADD COLUMN boost_id INT NULL COMMENT 'Reference to promotional boost',
ADD INDEX idx_is_boosted (is_boosted),
ADD INDEX idx_boost_expires_at (boost_expires_at);

-- Add boost fields to swap_deals table
ALTER TABLE swap_deals 
ADD COLUMN is_boosted BOOLEAN DEFAULT FALSE COMMENT 'Whether swap deal is currently boosted',
ADD COLUMN boost_expires_at TIMESTAMP NULL COMMENT 'When boost expires',
ADD COLUMN boost_id INT NULL COMMENT 'Reference to promotional boost',
ADD INDEX idx_is_boosted (is_boosted),
ADD INDEX idx_boost_expires_at (boost_expires_at);

-- Add boost fields to auctions table
ALTER TABLE auctions 
ADD COLUMN is_boosted BOOLEAN DEFAULT FALSE COMMENT 'Whether auction is currently boosted',
ADD COLUMN boost_expires_at TIMESTAMP NULL COMMENT 'When boost expires',
ADD COLUMN boost_id INT NULL COMMENT 'Reference to promotional boost',
ADD INDEX idx_is_boosted (is_boosted),
ADD INDEX idx_boost_expires_at (boost_expires_at);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check if tables were created successfully
SELECT 'Subscription Plans' as table_name, COUNT(*) as record_count FROM subscription_plans
UNION ALL
SELECT 'User Subscriptions' as table_name, COUNT(*) as record_count FROM user_subscriptions
UNION ALL
SELECT 'Subscription Usage' as table_name, COUNT(*) as record_count FROM subscription_usage
UNION ALL
SELECT 'Promotional Boosts' as table_name, COUNT(*) as record_count FROM promotional_boosts;

-- Verify subscription plans were inserted correctly
SELECT id, name, display_name, price, max_listings, can_create_group_buy, has_verified_badge 
FROM subscription_plans 
ORDER BY price ASC;
