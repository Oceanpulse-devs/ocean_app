-- =============================================
-- RESTORE SUBSCRIPTION PLANS
-- Created: 2026-01-15
-- Description: Restores subscription plans after database tables were dropped
-- Includes both NGN and USD prices
-- =============================================

-- Clear any existing plans safely without breaking foreign keys
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM `subscription_plans` WHERE `id` > 0;

-- Drift Plan (₦1,500/month or $5/month) - Startup
INSERT INTO `subscription_plans` (
  `id`, `name`, `display_name`, `price`, `price_usd`, `currency`, `billing_period`,
  `max_listings`, `max_group_buys`, `max_swap_deals`, `max_auctions`, `max_distress_sales`,
  `max_daily_dms`, `max_daily_notifications`, `max_ar_products`, `max_promotional_boosts`,
  `can_create_group_buy`, `can_create_swap_deals`, `can_create_auctions`, `can_create_distress_sales`,
  `can_use_ar`, `can_customize_shopfront`, `has_verified_badge`, `has_priority_search`,
  `has_buyer_insights`, `has_unlimited_features`, `features`, `description`,
  `is_active`, `created_at`, `updated_at`
) VALUES (
  1, 'drift', 'Drift', 1500.00, 5.00, 'NGN', 'monthly',
  2, 0, 2, 0, 2,
  999999, 4, 0, 0,
  FALSE, TRUE, FALSE, TRUE,
  FALSE, FALSE, FALSE, FALSE,
  TRUE, FALSE, 
  '["Up to 2 listings", "2 distress sales and 2 swap deals", "Normal exposure in search", "Receives and can accept up to 4 daily product demand (leads) requests", "Express interest in up to 3 buyer search insights daily"]',
  'Startup plan for new sellers. Up to 2 listings, 2 distress sales, 2 swap deals, normal search exposure, up to 4 daily product demand requests, and express interest in up to 3 buyer search insights daily.',
  TRUE, NOW(), NOW()
);

-- Wave Plan (₦3,000/month or $8/month) - Basic
INSERT INTO `subscription_plans` (
  `id`, `name`, `display_name`, `price`, `price_usd`, `currency`, `billing_period`,
  `max_listings`, `max_group_buys`, `max_swap_deals`, `max_auctions`, `max_distress_sales`,
  `max_daily_dms`, `max_daily_notifications`, `max_ar_products`, `max_promotional_boosts`,
  `can_create_group_buy`, `can_create_swap_deals`, `can_create_auctions`, `can_create_distress_sales`,
  `can_use_ar`, `can_customize_shopfront`, `has_verified_badge`, `has_priority_search`,
  `has_buyer_insights`, `has_unlimited_features`, `features`, `description`,
  `is_active`, `created_at`, `updated_at`
) VALUES (
  2, 'wave', 'Wave', 3000.00, 8.00, 'NGN', 'monthly',
  5, 1, 10, 2, 10,
  999999, 7, 0, 1,
  TRUE, TRUE, TRUE, TRUE,
  FALSE, FALSE, FALSE, TRUE,
  TRUE, FALSE,
  '["Up to 5 listings", "10 distress sales, 10 swap deals and 2 auctions", "Highlighted in searches", "Receives and can accept up to 7 daily product demand (leads) requests", "Express interest in up to 6 buyer search insights daily"]',
  'Basic plan for growing sellers. Up to 5 listings, 10 distress sales, 10 swap deals and 2 auctions, highlighted in searches, up to 7 daily product demand requests, and express interest in up to 6 buyer search insights daily.',
  TRUE, NOW(), NOW()
);

-- Tide Plan (₦5,500/month or $10/month) - Business
INSERT INTO `subscription_plans` (
  `id`, `name`, `display_name`, `price`, `price_usd`, `currency`, `billing_period`,
  `max_listings`, `max_group_buys`, `max_swap_deals`, `max_auctions`, `max_distress_sales`,
  `max_daily_dms`, `max_daily_notifications`, `max_ar_products`, `max_promotional_boosts`,
  `can_create_group_buy`, `can_create_swap_deals`, `can_create_auctions`, `can_create_distress_sales`,
  `can_use_ar`, `can_customize_shopfront`, `has_verified_badge`, `has_priority_search`,
  `has_buyer_insights`, `has_unlimited_features`, `features`, `description`,
  `is_active`, `created_at`, `updated_at`
) VALUES (
  3, 'tide', 'Tide', 5500.00, 10.00, 'NGN', 'monthly',
  100, 10, 15, 6, 15,
  999999, 15, 0, 3,
  TRUE, TRUE, TRUE, TRUE,
  FALSE, TRUE, TRUE, TRUE,
  TRUE, FALSE,
  '["Up to 100 listings", "Priority visibility in buyer searches", "Verified Seller Badge", "15 swap deals, 15 distress sales and 6 auctions", "Receives and can accept up to 15 daily product demand (leads) requests", "Express interest in up to 10 buyer search insights daily", "Shopfront customization (logo, banner, shop bio)"]',
  'Business plan for serious vendors. Up to 100 listings, priority search visibility, Verified Seller Badge, 15 swap deals, 15 distress sales and 6 auctions, up to 15 daily product demand requests, express interest in up to 10 buyer search insights daily, and shopfront customization.',
  TRUE, NOW(), NOW()
);

-- Surge Plan (₦7,000/month or $12/month) - Enterprise
INSERT INTO `subscription_plans` (
  `id`, `name`, `display_name`, `price`, `price_usd`, `currency`, `billing_period`,
  `max_listings`, `max_group_buys`, `max_swap_deals`, `max_auctions`, `max_distress_sales`,
  `max_daily_dms`, `max_daily_notifications`, `max_ar_products`, `max_promotional_boosts`,
  `can_create_group_buy`, `can_create_swap_deals`, `can_create_auctions`, `can_create_distress_sales`,
  `can_use_ar`, `can_customize_shopfront`, `has_verified_badge`, `has_priority_search`,
  `has_buyer_insights`, `has_unlimited_features`, `features`, `description`,
  `is_active`, `created_at`, `updated_at`
) VALUES (
  4, 'surge', 'Surge', 7000.00, 12.00, 'NGN', 'monthly',
  999999, 999999, 999999, 999999, 999999,
  999999, 20, 0, 999999,
  TRUE, TRUE, TRUE, TRUE,
  FALSE, TRUE, TRUE, TRUE,
  TRUE, TRUE,
  '["Everything open and unlimited", "Unlimited listings, group buys, swap deals, distress sales and auctions", "Top ranking in search and feeds", "All products posted are treated as promotional boosts", "Verified Seller Badge", "Top priority customer support", "Unlimited buyer search insights interest expressions", "Receives and can accept up to 20 daily product demand (leads) requests"]',
  'Enterprise plan with everything unlimited. Unlimited listings, deals, and auctions, top ranking in search and feeds, all products boosted, Verified Seller Badge, top priority support, unlimited search insight interest expressions, and up to 20 daily product demand requests.',
  TRUE, NOW(), NOW()
);

SET FOREIGN_KEY_CHECKS = 1;