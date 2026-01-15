-- =============================================
-- RESTORE SUBSCRIPTION PLANS
-- Created: 2026-01-15
-- Description: Restores subscription plans after database tables were dropped
-- Includes both NGN and USD prices
-- =============================================

-- Clear any existing plans (if any)
DELETE FROM subscription_plans WHERE id > 0;

-- Drift Plan (₦1,500/month or $5/month) - Startup
INSERT INTO subscription_plans (
  name, display_name, price, price_usd, currency, billing_period,
  max_listings, max_group_buys, max_swap_deals, max_auctions, max_distress_sales,
  max_daily_dms, max_daily_notifications, max_ar_products, max_promotional_boosts,
  can_create_group_buy, can_create_swap_deals, can_create_auctions, can_create_distress_sales,
  can_use_ar, can_customize_shopfront, has_verified_badge, has_priority_search,
  has_buyer_insights, has_unlimited_features, features, description,
  created_at, updated_at
) VALUES (
  'drift', 'Drift', 1500.00, 5.00, 'NGN', 'monthly',
  2, 0, 0, 0, 0,
  1, 0, 0, 0,
  FALSE, FALSE, FALSE, FALSE,
  FALSE, FALSE, FALSE, FALSE,
  FALSE, FALSE, 
  JSON_ARRAY('Basic chat with buyers', 'Join group buys', 'Very limited exposure in search'),
  'Perfect for new sellers getting started. Basic features with limited exposure.',
  NOW(), NOW()
);

-- Wave Plan (₦3,000/month or $8/month) - Basic
INSERT INTO subscription_plans (
  name, display_name, price, price_usd, currency, billing_period,
  max_listings, max_group_buys, max_swap_deals, max_auctions, max_distress_sales,
  max_daily_dms, max_daily_notifications, max_ar_products, max_promotional_boosts,
  can_create_group_buy, can_create_swap_deals, can_create_auctions, can_create_distress_sales,
  can_use_ar, can_customize_shopfront, has_verified_badge, has_priority_search,
  has_buyer_insights, has_unlimited_features, features, description,
  created_at, updated_at
) VALUES (
  'wave', 'Wave', 3000.00, 8.00, 'NGN', 'monthly',
  5, 1, 1, 1, 4,
  4, 1, 0, 1,
  TRUE, TRUE, TRUE, TRUE,
  FALSE, FALSE, FALSE, TRUE,
  FALSE, FALSE,
  JSON_ARRAY('Highlighted in searches', 'Create 1 group buy post', '1 free promotional boost per month'),
  'Great for growing sellers. More listings and basic promotional features.',
  NOW(), NOW()
);

-- Tide Plan (₦5,500/month or $10/month) - Business
INSERT INTO subscription_plans (
  name, display_name, price, price_usd, currency, billing_period,
  max_listings, max_group_buys, max_swap_deals, max_auctions, max_distress_sales,
  max_daily_dms, max_daily_notifications, max_ar_products, max_promotional_boosts,
  can_create_group_buy, can_create_swap_deals, can_create_auctions, can_create_distress_sales,
  can_use_ar, can_customize_shopfront, has_verified_badge, has_priority_search,
  has_buyer_insights, has_unlimited_features, features, description,
  created_at, updated_at
) VALUES (
  'tide', 'Tide', 5500.00, 10.00, 'NGN', 'monthly',
  100, 10, 10, 10, 10,
  20, 20, 20, 3,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE, TRUE,
  FALSE, FALSE,
  JSON_ARRAY('Verified Seller Badge', 'Shopfront customization', 'AR for 20 products', 'Sale insights'),
  'Perfect for business owners. Advanced features with verified badge and analytics.',
  NOW(), NOW()
);

-- Surge Plan (₦7,000/month or $12/month) - Enterprise
INSERT INTO subscription_plans (
  name, display_name, price, price_usd, currency, billing_period,
  max_listings, max_group_buys, max_swap_deals, max_auctions, max_distress_sales,
  max_daily_dms, max_daily_notifications, max_ar_products, max_promotional_boosts,
  can_create_group_buy, can_create_swap_deals, can_create_auctions, can_create_distress_sales,
  can_use_ar, can_customize_shopfront, has_verified_badge, has_priority_search,
  has_buyer_insights, has_unlimited_features, features, description,
  created_at, updated_at
) VALUES (
  'surge', 'Surge', 7000.00, 12.00, 'NGN', 'monthly',
  999999, 999999, 999999, 999999, 999999,
  999999, 999999, 999999, 999999,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE,
  JSON_ARRAY('Everything unlimited', 'Top ranking in search & feeds', 'All products promotional boost', 'Top priority customer service', 'Access to buyer search insights'),
  'Ultimate plan for serious sellers. Everything unlimited with premium support.',
  NOW(), NOW()
);

-- Verify the plans were inserted correctly
SELECT id, name, display_name, price, price_usd, currency, max_listings, can_create_group_buy, has_verified_badge 
FROM subscription_plans 
ORDER BY price ASC;