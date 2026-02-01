-- =====================================================
-- BACKFILL POSTS userCountry / userRegion FROM SELLERS
-- Date: 2026-01-15
-- Description: Updates existing feed posts so userCountry and userRegion
--              reflect the actual seller's country/state (fixes old data
--              created when triggers hardcoded 'Nigeria'/'Lagos').
-- Run this AFTER applying the updated feed triggers.
-- =====================================================

-- Products: post source_id = product id, product.sellerId = sellers.id
UPDATE `posts` p
INNER JOIN `products` pr ON p.`source_table` = 'products' AND p.`source_id` = pr.`id`
INNER JOIN `sellers` s ON pr.`sellerId` = s.`id`
SET
    p.`userCountry` = COALESCE(s.`country`, p.`userCountry`),
    p.`userRegion` = COALESCE(s.`state`, p.`userRegion`),
    p.`updatedAt` = NOW()
WHERE p.`source_table` = 'products';

-- Auctions: post source_id = auction id, auction.sellerId = sellers.id
UPDATE `posts` p
INNER JOIN `auctions` a ON p.`source_table` = 'auctions' AND p.`source_id` = a.`id`
INNER JOIN `sellers` s ON a.`sellerId` = s.`id`
SET
    p.`userCountry` = COALESCE(s.`country`, p.`userCountry`),
    p.`userRegion` = COALESCE(s.`state`, p.`userRegion`),
    p.`updatedAt` = NOW()
WHERE p.`source_table` = 'auctions';

-- Group buys: post source_id = group_buy id, group_buys.creator_id = sellers.userId
UPDATE `posts` p
INNER JOIN `group_buys` g ON p.`source_table` = 'group_buys' AND p.`source_id` = g.`id`
INNER JOIN `sellers` s ON s.`userId` = g.`creator_id`
SET
    p.`userCountry` = COALESCE(s.`country`, p.`userCountry`),
    p.`userRegion` = COALESCE(s.`state`, p.`userRegion`),
    p.`updatedAt` = NOW()
WHERE p.`source_table` = 'group_buys';

-- Swap deals: post source_id = swap_deal id, swap_deals.seller_id = sellers.userId
UPDATE `posts` p
INNER JOIN `swap_deals` sd ON p.`source_table` = 'swap_deals' AND p.`source_id` = sd.`id`
INNER JOIN `sellers` s ON s.`userId` = sd.`seller_id`
SET
    p.`userCountry` = COALESCE(s.`country`, p.`userCountry`),
    p.`userRegion` = COALESCE(s.`state`, p.`userRegion`),
    p.`updatedAt` = NOW()
WHERE p.`source_table` = 'swap_deals';

-- Buyer needs: post source_id = buyer_need id, buyer_needs.buyer_id = sellers.userId (if buyer is also a seller)
UPDATE `posts` p
INNER JOIN `buyer_needs` bn ON p.`source_table` = 'buyer_needs' AND p.`source_id` = bn.`id`
INNER JOIN `sellers` s ON s.`userId` = bn.`buyer_id`
SET
    p.`userCountry` = COALESCE(s.`country`, p.`userCountry`),
    p.`userRegion` = COALESCE(s.`state`, p.`userRegion`),
    p.`updatedAt` = NOW()
WHERE p.`source_table` = 'buyer_needs';

-- =====================================================
-- VERIFICATION (optional - run to check row counts)
-- =====================================================
-- SELECT source_table, userCountry, COUNT(*) AS cnt
-- FROM posts
-- WHERE source_table IS NOT NULL
-- GROUP BY source_table, userCountry
-- ORDER BY source_table, userCountry;
