-- =============================================
-- RESTORE SUBSCRIPTION PLANS
-- Created: 2026-01-15
-- Description: Restores subscription plans after database tables were dropped
-- Includes both NGN and USD prices
-- =============================================

-- Clear any existing plans
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
  2, 0, 0, 0, 0,
  1, 0, 0, 0,
  FALSE, FALSE, FALSE, FALSE,
  FALSE, FALSE, FALSE, FALSE,
  FALSE, FALSE, 
  '["Up to 2 listings", "Cannot create group buys", "Cannot initiate swap deals, distress sales or auctions", "Very limited exposure in search", "Can DM only 1 buyer-need (product demand) post per day", "Does not get category notifications when buyers post needs"]',
  'Startup plan for new sellers. Up to 2 listings, no group buys, swaps or auctions, very limited search exposure, can DM only 1 buyer-need (product demand) post per day, and no category notifications.',
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
  5, 1, 1, 1, 4,
  3, 0, 0, 1,
  TRUE, TRUE, TRUE, TRUE,
  FALSE, FALSE, FALSE, TRUE,
  FALSE, FALSE,
  '["Up to 5 listings", "Highlighted in searches", "Create 1 group buy post", "Can initiate 1 swap deal, 4 distress sales and 1 auction", "No daily product demand (leads) notifications", "Can DM 3 individual buyer-need (product demand) posts per day", "1 free promotional boost per month"]',
  'Basic plan for growing sellers. Up to 5 listings, highlighted in searches, 1 group buy, 1 swap deal, 4 distress sales and 1 auction, no daily buyer-need notifications, can DM 3 buyer-need (product demand) posts per day, plus 1 free promotional boost per month.',
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
  100, 10, 10, 10, 10,
  20, 7, 0, 3,
  TRUE, TRUE, TRUE, TRUE,
  FALSE, TRUE, TRUE, TRUE,
  FALSE, FALSE,
  '["Everything in Wave", "Up to 100 listings", "Priority visibility in buyer searches", "3 promotional boosts per month", "Verified Seller Badge", "Can DM 20 buyer-need (product demand) posts per day", "Receives up to 7 daily product demand (leads) notifications", "Up to 10 group buys, 10 distress sales, 10 auctions and 10 swap deals", "Shopfront customization (logo, banner, shop bio)", "Sales insights / advanced analytics"]',
  'Business plan for serious vendors. Includes everything in Wave plus up to 100 listings, priority search visibility, 3 boosts/month, Verified Seller Badge, can DM 20 buyer-need (product demand) posts per day, 7 daily buyer-need notifications, 10 group buys/distress sales/auctions/swaps, full shopfront customization and sales insights analytics.',
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
  999999, 15, 0, 999999,
  TRUE, TRUE, TRUE, TRUE,
  FALSE, TRUE, TRUE, TRUE,
  TRUE, TRUE,
  '["Everything open and unlimited", "Unlimited listings, group buys, swap deals, distress sales and auctions", "Top ranking in search and feeds", "All products posted are treated as promotional boosts", "Verified Seller Badge", "Top priority customer service", "Access to buyer search insights", "Access to product demand trends (see what buyers could not find and what sells the most)", "Receives up to 15 daily product demand (leads) notifications, unlimited DMs", "Full advanced analytics and insights"]',
  'Enterprise plan with everything unlimited. Unlimited listings and deal types, top ranking in search and feeds, every product acts as a promotional boost, Verified Seller Badge, top priority support, full access to buyer search insights and product demand trends, and up to 15 daily product demand (leads) notifications, unlimited DMs with advanced analytics.',
  TRUE, NOW(), NOW()
);