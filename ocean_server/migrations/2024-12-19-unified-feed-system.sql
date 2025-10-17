-- =====================================================
-- Unified Feed System Migration
-- Date: 2024-12-19
-- Description: Adds unified feed fields to posts table and creates triggers
-- =====================================================

-- Add new columns to posts table
ALTER TABLE `posts` 
ADD COLUMN `content_type` ENUM('post', 'product', 'group_buy', 'swap_deal', 'auction', 'distress_sale') 
NOT NULL DEFAULT 'post' 
COMMENT 'Type of content this post represents';

ALTER TABLE `posts` 
ADD COLUMN `source_id` VARCHAR(255) 
COMMENT 'ID of the original item (product_id, group_buy_id, etc.)';

ALTER TABLE `posts` 
ADD COLUMN `source_table` VARCHAR(50) 
COMMENT 'Original table name (products, group_buys, swap_deals, etc.)';

ALTER TABLE `posts` 
ADD COLUMN `auto_generated` BOOLEAN DEFAULT FALSE 
COMMENT 'Whether this post was auto-generated from another content type';

ALTER TABLE `posts` 
ADD COLUMN `original_created_at` DATETIME 
COMMENT 'Original creation date from source item';

ALTER TABLE `posts` 
ADD COLUMN `feed_metadata` JSON 
COMMENT 'Additional metadata for feed display (pricing, status, etc.)';

ALTER TABLE `posts` 
ADD COLUMN `feed_visible` BOOLEAN DEFAULT TRUE 
COMMENT 'Whether this post should appear in the main feed';

ALTER TABLE `posts` 
ADD COLUMN `feed_priority` INT DEFAULT 0 
COMMENT 'Priority score for feed ordering (higher = more important)';

-- Create indexes for performance
CREATE INDEX `idx_posts_content_type` ON `posts` (`content_type`);
CREATE INDEX `idx_posts_source` ON `posts` (`source_table`, `source_id`);
CREATE INDEX `idx_posts_feed_visible` ON `posts` (`feed_visible`, `status`);
CREATE INDEX `idx_posts_feed_priority` ON `posts` (`feed_priority`, `createdAt`);
CREATE INDEX `idx_posts_auto_generated` ON `posts` (`auto_generated`);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC FEED SYNC
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS `tr_product_to_feed`;
DROP TRIGGER IF EXISTS `tr_group_buy_to_feed`;
DROP TRIGGER IF EXISTS `tr_swap_deal_to_feed`;
DROP TRIGGER IF EXISTS `tr_auction_to_feed`;
DROP TRIGGER IF EXISTS `tr_product_update_feed`;
DROP TRIGGER IF EXISTS `tr_group_buy_update_feed`;
DROP TRIGGER IF EXISTS `tr_auction_update_feed`;

-- Product to Feed Trigger
CREATE TRIGGER `tr_product_to_feed` 
AFTER INSERT ON `products` 
FOR EACH ROW 
BEGIN
    DECLARE user_id_var VARCHAR(255);
    DECLARE post_content_var TEXT;
    DECLARE content_type_var VARCHAR(50);
    DECLARE feed_priority_var INT;
    
    -- Get the user ID from the seller
    SELECT userId INTO user_id_var 
    FROM sellers 
    WHERE id = NEW.sellerId 
    LIMIT 1;
    
    -- Determine content type and priority
    IF COALESCE(NEW.isDistressSale, FALSE) = TRUE THEN
        SET content_type_var = 'distress_sale';
        SET post_content_var = CONCAT('Distress Sale: ', NEW.title, ' - ', COALESCE(NEW.description, ''));
        SET feed_priority_var = CASE 
            WHEN COALESCE(NEW.is_boosted, FALSE) = TRUE THEN 100
            ELSE 75
        END;
    ELSE
        SET content_type_var = 'product';
        SET post_content_var = CONCAT('New Product: ', NEW.title, ' - ', COALESCE(NEW.description, ''));
        SET feed_priority_var = CASE 
            WHEN COALESCE(NEW.is_boosted, FALSE) = TRUE THEN 100
            WHEN COALESCE(NEW.isFeatured, FALSE) = TRUE THEN 50
            ELSE 0
        END;
    END IF;
    
    -- Insert into posts table
    INSERT INTO `posts` (
        `id`,
        `userId`,
        `postType`,
        `content`,
        `productName`,
        `brand`,
        `price`,
        `currency`,
        `location`,
        `userRegion`,
        `userCountry`,
        `content_type`,
        `source_id`,
        `source_table`,
        `auto_generated`,
        `original_created_at`,
        `feed_metadata`,
        `feed_visible`,
        `feed_priority`,
        `status`,
        `createdAt`,
        `updatedAt`
    ) VALUES (
        UUID(),
        user_id_var,
        'product',
        post_content_var,
        NEW.title,
        NEW.brand,
        NEW.price,
        NEW.currency,
        NEW.location,
        COALESCE(NEW.location, 'Lagos'),
        'Nigeria',
        content_type_var,
        NEW.id,
        'products',
        TRUE,
        NEW.createdAt,
        JSON_OBJECT(
            'product_id', NEW.id,
            'category', NEW.category,
            'condition', NEW.condition,
            'images', NEW.images,
            'isAvailable', NEW.isAvailable,
            'isBoosted', COALESCE(NEW.is_boosted, FALSE),
            'isDistressSale', COALESCE(NEW.isDistressSale, FALSE),
            'originalPrice', NEW.originalPrice,
            'discountPercentage', NEW.discountPercentage,
            'urgencyLevel', NEW.urgencyLevel
        ),
        NEW.isAvailable,
        feed_priority_var,
        CASE WHEN NEW.isAvailable = TRUE THEN 'active' ELSE 'inactive' END,
        NOW(),
        NOW()
    );
    
    -- Insert media into postmedia table
    INSERT INTO `postmedia` (
        `id`,
        `postId`,
        `mediaUrl`,
        `mediaType`,
        `createdAt`,
        `updatedAt`
    )
    SELECT 
        UUID(),
        LAST_INSERT_ID(),
        JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))),
        'image',
        NOW(),
        NOW()
    FROM (
        SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
    ) numbers
    WHERE JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))) IS NOT NULL
    AND JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))) != '';
END;

-- Group Buy to Feed Trigger
CREATE TRIGGER `tr_group_buy_to_feed` 
AFTER INSERT ON `group_buys` 
FOR EACH ROW 
BEGIN
    DECLARE user_id_var VARCHAR(255);
    
    -- Get the user ID from the creator
    SELECT userId INTO user_id_var 
    FROM sellers 
    WHERE id = NEW.sellerId 
    LIMIT 1;
    
    -- Insert into posts table
    INSERT INTO `posts` (
        `id`,
        `userId`,
        `postType`,
        `content`,
        `productName`,
        `brand`,
        `price`,
        `currency`,
        `location`,
        `userRegion`,
        `userCountry`,
        `content_type`,
        `source_id`,
        `source_table`,
        `auto_generated`,
        `original_created_at`,
        `feed_metadata`,
        `feed_visible`,
        `feed_priority`,
        `status`,
        `createdAt`,
        `updatedAt`
    ) VALUES (
        UUID(),
        user_id_var,
        'general',
        CONCAT('Group Buy: ', NEW.title, ' - ', COALESCE(NEW.description, '')),
        NEW.title,
        NEW.brand,
        NEW.price,
        NEW.currency,
        NEW.location,
        COALESCE(NEW.location, 'Lagos'),
        'Nigeria',
        'group_buy',
        NEW.id,
        'group_buys',
        TRUE,
        NEW.createdAt,
        JSON_OBJECT(
            'group_buy_id', NEW.id,
            'target_quantity', NEW.targetQuantity,
            'current_quantity', NEW.currentQuantity,
            'price_per_unit', NEW.pricePerUnit,
            'discount_percentage', NEW.discountPercentage,
            'start_date', NEW.startDate,
            'end_date', NEW.endDate,
            'status', NEW.status,
            'images', NEW.images,
            'isBoosted', COALESCE(NEW.is_boosted, FALSE),
            'isFeatured', COALESCE(NEW.is_featured, FALSE)
        ),
        CASE WHEN NEW.status = 'active' THEN TRUE ELSE FALSE END,
        CASE 
            WHEN COALESCE(NEW.is_boosted, FALSE) = TRUE THEN 100
            WHEN COALESCE(NEW.is_featured, FALSE) = TRUE THEN 50
            WHEN NEW.status = 'active' THEN 25
            ELSE 0
        END,
        CASE WHEN NEW.status = 'cancelled' THEN 'inactive' ELSE 'active' END,
        NOW(),
        NOW()
    );
    
    -- Insert media into postmedia table
    INSERT INTO `postmedia` (
        `id`,
        `postId`,
        `mediaUrl`,
        `mediaType`,
        `createdAt`,
        `updatedAt`
    )
    SELECT 
        UUID(),
        LAST_INSERT_ID(),
        JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))),
        'image',
        NOW(),
        NOW()
    FROM (
        SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
    ) numbers
    WHERE JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))) IS NOT NULL
    AND JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))) != '';
END;

-- Swap Deal to Feed Trigger
CREATE TRIGGER `tr_swap_deal_to_feed` 
AFTER INSERT ON `swap_deals` 
FOR EACH ROW 
BEGIN
    DECLARE user_id_var VARCHAR(255);
    DECLARE initiator_images JSON;
    DECLARE responder_images JSON;
    
    -- Get the user ID from the initiator
    SELECT id INTO user_id_var 
    FROM user_tables 
    WHERE id = NEW.initiator_id 
    LIMIT 1;
    
    -- Get images from initiator item
    SELECT images INTO initiator_images 
    FROM products 
    WHERE id = NEW.initiator_item_id 
    LIMIT 1;
    
    -- Get images from responder item
    SELECT images INTO responder_images 
    FROM products 
    WHERE id = NEW.responder_item_id 
    LIMIT 1;
    
    -- Insert into posts table
    INSERT INTO `posts` (
        `id`,
        `userId`,
        `postType`,
        `content`,
        `productName`,
        `brand`,
        `price`,
        `currency`,
        `location`,
        `userRegion`,
        `userCountry`,
        `content_type`,
        `source_id`,
        `source_table`,
        `auto_generated`,
        `original_created_at`,
        `feed_metadata`,
        `feed_visible`,
        `feed_priority`,
        `status`,
        `createdAt`,
        `updatedAt`
    ) VALUES (
        UUID(),
        user_id_var,
        'general',
        CONCAT('Swap Deal: ', NEW.title, ' - ', COALESCE(NEW.description, '')),
        NEW.title,
        NULL,
        NULL,
        'NGN',
        NEW.location,
        COALESCE(NEW.location, 'Lagos'),
        'Nigeria',
        'swap_deal',
        NEW.id,
        'swap_deals',
        TRUE,
        NEW.createdAt,
        JSON_OBJECT(
            'swap_deal_id', NEW.id,
            'initiator_item_id', NEW.initiator_item_id,
            'responder_item_id', NEW.responder_item_id,
            'status', NEW.status,
            'initiator_images', initiator_images,
            'responder_images', responder_images,
            'isBoosted', COALESCE(NEW.is_boosted, FALSE),
            'is_featured', COALESCE(NEW.is_featured, FALSE)
        ),
        CASE WHEN NEW.status = 'active' THEN TRUE ELSE FALSE END,
        CASE 
            WHEN COALESCE(NEW.is_boosted, FALSE) = TRUE THEN 100
            WHEN COALESCE(NEW.is_featured, FALSE) = TRUE THEN 50
            WHEN NEW.status = 'active' THEN 25
            ELSE 0
        END,
        CASE WHEN NEW.status = 'cancelled' THEN 'inactive' ELSE 'active' END,
        NOW(),
        NOW()
    );
    
    -- Insert initiator item images into postmedia table
    INSERT INTO `postmedia` (
        `id`,
        `postId`,
        `mediaUrl`,
        `mediaType`,
        `createdAt`,
        `updatedAt`
    )
    SELECT 
        UUID(),
        LAST_INSERT_ID(),
        JSON_UNQUOTE(JSON_EXTRACT(initiator_images, CONCAT('$[', idx, ']'))),
        'image',
        NOW(),
        NOW()
    FROM (
        SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
    ) numbers
    WHERE JSON_UNQUOTE(JSON_EXTRACT(initiator_images, CONCAT('$[', idx, ']'))) IS NOT NULL
    AND JSON_UNQUOTE(JSON_EXTRACT(initiator_images, CONCAT('$[', idx, ']'))) != '';
    
    -- Insert responder item images into postmedia table
    INSERT INTO `postmedia` (
        `id`,
        `postId`,
        `mediaUrl`,
        `mediaType`,
        `createdAt`,
        `updatedAt`
    )
    SELECT 
        UUID(),
        LAST_INSERT_ID(),
        JSON_UNQUOTE(JSON_EXTRACT(responder_images, CONCAT('$[', idx, ']'))),
        'image',
        NOW(),
        NOW()
    FROM (
        SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
    ) numbers
    WHERE JSON_UNQUOTE(JSON_EXTRACT(responder_images, CONCAT('$[', idx, ']'))) IS NOT NULL
    AND JSON_UNQUOTE(JSON_EXTRACT(responder_images, CONCAT('$[', idx, ']'))) != '';
END;

-- Auction to Feed Trigger
CREATE TRIGGER `tr_auction_to_feed` 
AFTER INSERT ON `auctions` 
FOR EACH ROW 
BEGIN
    DECLARE user_id_var VARCHAR(255);
    
    -- Get the user ID from the seller
    SELECT userId INTO user_id_var 
    FROM sellers 
    WHERE id = NEW.sellerId 
    LIMIT 1;
    
    -- Insert into posts table
    INSERT INTO `posts` (
        `id`,
        `userId`,
        `postType`,
        `content`,
        `productName`,
        `price`,
        `currency`,
        `location`,
        `userRegion`,
        `userCountry`,
        `content_type`,
        `source_id`,
        `source_table`,
        `auto_generated`,
        `original_created_at`,
        `feed_metadata`,
        `feed_visible`,
        `feed_priority`,
        `status`,
        `createdAt`,
        `updatedAt`
    ) VALUES (
        UUID(),
        user_id_var,
        'general',
        CONCAT('Auction: ', NEW.title, ' - Starting at ₦', NEW.startingPrice),
        NEW.title,
        NEW.startingPrice,
        'NGN',
        NEW.location,
        COALESCE(NEW.location, 'Lagos'),
        'Nigeria',
        'auction',
        NEW.id,
        'auctions',
        TRUE,
        NEW.createdAt,
        JSON_OBJECT(
            'auction_id', NEW.id,
            'starting_price', NEW.startingPrice,
            'current_price', NEW.currentPrice,
            'reserve_price', NEW.reservePrice,
            'minimum_bid_increment', NEW.minimumBidIncrement,
            'start_time', NEW.startTime,
            'end_time', NEW.endTime,
            'status', NEW.status,
            'images', NEW.images,
            'isBoosted', COALESCE(NEW.is_boosted, FALSE),
            'totalBids', NEW.totalBids,
            'uniqueBidders', NEW.uniqueBidders
        ),
        CASE WHEN NEW.status = 'active' THEN TRUE ELSE FALSE END,
        CASE 
            WHEN COALESCE(NEW.is_boosted, FALSE) = TRUE THEN 100
            WHEN NEW.status = 'active' THEN 25
            ELSE 0
        END,
        CASE WHEN NEW.status = 'cancelled' THEN 'inactive' ELSE 'active' END,
        NOW(),
        NOW()
    );
    
    -- Insert media into postmedia table
    INSERT INTO `postmedia` (
        `id`,
        `postId`,
        `mediaUrl`,
        `mediaType`,
        `createdAt`,
        `updatedAt`
    )
    SELECT 
        UUID(),
        LAST_INSERT_ID(),
        JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))),
        'image',
        NOW(),
        NOW()
    FROM (
        SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
    ) numbers
    WHERE JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))) IS NOT NULL
    AND JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))) != '';
END;

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================

-- Product Update Trigger
CREATE TRIGGER `tr_product_update_feed` 
AFTER UPDATE ON `products` 
FOR EACH ROW 
BEGIN
    UPDATE `posts` 
    SET 
        `feed_visible` = NEW.isAvailable,
        `feed_priority` = CASE 
            WHEN COALESCE(NEW.is_boosted, FALSE) = TRUE THEN 100
            WHEN COALESCE(NEW.isDistressSale, FALSE) = TRUE THEN 75
            WHEN COALESCE(NEW.isFeatured, FALSE) = TRUE THEN 50
            ELSE 0
        END,
        `status` = CASE WHEN NEW.isAvailable = TRUE THEN 'active' ELSE 'inactive' END,
        `updatedAt` = NOW()
    WHERE `source_table` = 'products' AND `source_id` = NEW.id;
END;

-- Group Buy Update Trigger
CREATE TRIGGER `tr_group_buy_update_feed` 
AFTER UPDATE ON `group_buys` 
FOR EACH ROW 
BEGIN
    UPDATE `posts` 
    SET 
        `feed_visible` = CASE WHEN NEW.status = 'active' THEN TRUE ELSE FALSE END,
        `feed_priority` = CASE 
            WHEN COALESCE(NEW.is_boosted, FALSE) = TRUE THEN 100
            WHEN COALESCE(NEW.is_featured, FALSE) = TRUE THEN 50
            WHEN NEW.status = 'active' THEN 25
            ELSE 0
        END,
        `status` = CASE WHEN NEW.status = 'cancelled' THEN 'inactive' ELSE 'active' END,
        `updatedAt` = NOW()
    WHERE `source_table` = 'group_buys' AND `source_id` = NEW.id;
END;

-- Auction Update Trigger
CREATE TRIGGER `tr_auction_update_feed` 
AFTER UPDATE ON `auctions` 
FOR EACH ROW 
BEGIN
    UPDATE `posts` 
    SET 
        `feed_visible` = CASE WHEN NEW.status = 'active' THEN TRUE ELSE FALSE END,
        `feed_priority` = CASE 
            WHEN COALESCE(NEW.is_boosted, FALSE) = TRUE THEN 100
            WHEN NEW.status = 'active' THEN 25
            ELSE 0
        END,
        `status` = CASE WHEN NEW.status = 'cancelled' THEN 'inactive' ELSE 'active' END,
        `updatedAt` = NOW()
    WHERE `source_table` = 'auctions' AND `source_id` = NEW.id;
END;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================