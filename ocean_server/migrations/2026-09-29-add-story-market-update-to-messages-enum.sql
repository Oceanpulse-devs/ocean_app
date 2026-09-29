-- Migration: Add 'story' and 'market_update' to messages.reference_type ENUM
ALTER TABLE `messages` 
MODIFY COLUMN `reference_type` ENUM(
  'buyer_need',
  'product',
  'swap_deal',
  'distress_sale',
  'auction',
  'story',
  'market_update'
) NULL DEFAULT NULL;
