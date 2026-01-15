-- =====================================================
-- RESTORE ALL FEED TRIGGERS
-- Date: 2026-01-15
-- Description: Restores all database triggers for unified feed system
-- Fixed: Removed isFeatured from products, fixed LAST_INSERT_ID() issues,
--        fixed table/column references to match actual schema
-- =====================================================

DELIMITER $$

-- =====================================================
-- DROP ALL EXISTING TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS `tr_product_to_feed`$$
DROP TRIGGER IF EXISTS `tr_product_update_feed`$$
DROP TRIGGER IF EXISTS `tr_product_images_to_feed`$$
DROP TRIGGER IF EXISTS `tr_group_buy_to_feed`$$
DROP TRIGGER IF EXISTS `tr_group_buy_update_feed`$$
DROP TRIGGER IF EXISTS `tr_swap_deal_to_feed`$$
DROP TRIGGER IF EXISTS `tr_swap_deal_update_feed`$$
DROP TRIGGER IF EXISTS `tr_auction_to_feed`$$
DROP TRIGGER IF EXISTS `tr_auction_update_feed`$$
DROP TRIGGER IF EXISTS `tr_buyer_need_to_feed`$$
DROP TRIGGER IF EXISTS `tr_buyer_need_update_feed`$$
DROP TRIGGER IF EXISTS `tr_buyer_need_media_to_feed`$$

-- =====================================================
-- PRODUCT TRIGGERS
-- =====================================================

-- Product to Feed Trigger (FIXED: Removed isFeatured, uses UUID() instead of LAST_INSERT_ID())
CREATE TRIGGER `tr_product_to_feed`
AFTER INSERT ON `products`
FOR EACH ROW 
BEGIN
    DECLARE user_id_var VARCHAR(255);
    DECLARE post_content_var TEXT;
    DECLARE content_type_var VARCHAR(50);
    DECLARE feed_priority_var INT;
    DECLARE new_post_id VARCHAR(255);
    
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
        SET post_content_var = COALESCE(NEW.description, NEW.title);
        SET feed_priority_var = CASE 
            WHEN COALESCE(NEW.is_boosted, FALSE) = TRUE THEN 100
            ELSE 0
        END;
    END IF;
    
    -- Generate UUID for the post
    SET new_post_id = UUID();
    
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
        new_post_id,
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
    
    -- Insert media into postmedia table using the post UUID
    INSERT INTO `postmedia` (
        `id`,
        `postId`,
        `mediaUrl`,
        `mediaType`,
        `thumbnailUrl`,
        `mediaOrder`,
        `createdAt`,
        `updatedAt`
    )
    SELECT 
        UUID(),
        new_post_id,
        JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))),
        'image',
        JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))),
        idx,
        NOW(),
        NOW()
    FROM (
        SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
    ) numbers
    WHERE JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']')) IS NOT NULL
    AND JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))) IS NOT NULL
    AND JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))) != ''
    AND JSON_LENGTH(NEW.images) > 0;
END$$

-- Product Update Trigger (FIXED: Removed isFeatured)
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
            ELSE 0
        END,
        `status` = CASE WHEN NEW.isAvailable = TRUE THEN 'active' ELSE 'inactive' END,
        `updatedAt` = NOW()
    WHERE `source_table` = 'products' AND `source_id` = NEW.id;
END$$

-- Product Images Update Trigger
CREATE TRIGGER `tr_product_images_to_feed`
AFTER UPDATE ON `products`
FOR EACH ROW 
BEGIN
    DECLARE existing_post_id VARCHAR(255);
    
    -- Check if images were updated and product has an associated feed post
    IF NEW.images != OLD.images AND NEW.images IS NOT NULL AND JSON_LENGTH(NEW.images) > 0 THEN
        -- Find the existing post for this product
        SELECT id INTO existing_post_id 
        FROM posts 
        WHERE source_id = NEW.id 
        AND source_table = 'products' 
        LIMIT 1;
        
        -- If post exists, add/update media
        IF existing_post_id IS NOT NULL THEN
            -- Delete old media for this post
            DELETE FROM postmedia WHERE postId = existing_post_id;
            
            -- Insert new media
            INSERT INTO `postmedia` (
                `id`,
                `postId`,
                `mediaUrl`,
                `mediaType`,
                `thumbnailUrl`,
                `mediaOrder`,
                `createdAt`,
                `updatedAt`
            )
            SELECT 
                UUID(),
                existing_post_id,
                JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))),
                'image',
                JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))),
                idx,
                NOW(),
                NOW()
            FROM (
                SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
            ) numbers
            WHERE JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']')) IS NOT NULL
            AND JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))) IS NOT NULL
            AND JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))) != '';
        END IF;
    END IF;
END$$

-- =====================================================
-- GROUP BUY TRIGGERS
-- =====================================================

-- Group Buy to Feed Trigger (FIXED: Uses creator_id directly, uses UUID() instead of LAST_INSERT_ID())
CREATE TRIGGER `tr_group_buy_to_feed` 
AFTER INSERT ON `group_buys` 
FOR EACH ROW 
BEGIN
    DECLARE new_post_id VARCHAR(255);
    
    -- Generate UUID for the post
    SET new_post_id = UUID();
    
    -- Insert into posts table (creator_id is already the user ID)
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
        new_post_id,
        NEW.creator_id,  -- creator_id is already the user ID
        'general',
        CONCAT('Group Buy: ', NEW.title, ' - ', COALESCE(NEW.description, '')),
        NEW.title,
        NULL,  -- Group buys don't have brand
        NEW.group_price,  -- Use group_price as the display price
        'NGN',  -- Default currency
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
            'product_name', NEW.product_name,
            'original_price', NEW.original_price,
            'group_price', NEW.group_price,
            'min_buyers', NEW.min_buyers,
            'max_buyers', NEW.max_buyers,
            'current_buyers', NEW.current_buyers,
            'deadline', NEW.deadline,
            'status', NEW.status,
            'images', NEW.product_image,  -- Use product_image field
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
    
    -- Insert media into postmedia table using the post UUID
    INSERT INTO `postmedia` (
        `id`,
        `postId`,
        `mediaUrl`,
        `mediaType`,
        `thumbnailUrl`,
        `mediaOrder`,
        `createdAt`,
        `updatedAt`
    )
    SELECT 
        UUID(),
        new_post_id,
        JSON_UNQUOTE(JSON_EXTRACT(NEW.product_image, CONCAT('$[', idx, ']'))),
        'image',
        JSON_UNQUOTE(JSON_EXTRACT(NEW.product_image, CONCAT('$[', idx, ']'))),
        idx,
        NOW(),
        NOW()
    FROM (
        SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
    ) numbers
    WHERE JSON_EXTRACT(NEW.product_image, CONCAT('$[', idx, ']')) IS NOT NULL
    AND JSON_UNQUOTE(JSON_EXTRACT(NEW.product_image, CONCAT('$[', idx, ']'))) IS NOT NULL
    AND JSON_UNQUOTE(JSON_EXTRACT(NEW.product_image, CONCAT('$[', idx, ']'))) != ''
    AND JSON_LENGTH(NEW.product_image) > 0;
END$$

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
END$$

-- =====================================================
-- SWAP DEAL TRIGGERS
-- =====================================================

-- Swap Deal to Feed Trigger (FIXED: Uses seller_id directly, uses images JSON field, uses UUID() instead of LAST_INSERT_ID())
CREATE TRIGGER `tr_swap_deal_to_feed` 
AFTER INSERT ON `swap_deals` 
FOR EACH ROW 
BEGIN
    DECLARE new_post_id VARCHAR(255);
    
    -- Generate UUID for the post
    SET new_post_id = UUID();
    
    -- Insert into posts table (seller_id is already the user ID)
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
        new_post_id,
        NEW.seller_id,  -- seller_id is already the user ID
        'general',
        CONCAT('Swap Deal: ', NEW.title, ' - ', COALESCE(NEW.description, '')),
        NEW.title,
        NULL,
        NULL,
        'NGN',
        NEW.meeting_location,
        COALESCE(NEW.meeting_location, 'Lagos'),
        'Nigeria',
        'swap_deal',
        NEW.id,
        'swap_deals',
        TRUE,
        NEW.createdAt,
        JSON_OBJECT(
            'swap_deal_id', NEW.id,
            'product_to_swap', NEW.product_to_swap,
            'category_to_swap', NEW.category_to_swap,
            'brand_to_swap', NEW.brand_to_swap,
            'status', NEW.status,
            'images', NEW.images,
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
    
    -- Insert images from swap deal into postmedia table using the post UUID
    INSERT INTO `postmedia` (
        `id`,
        `postId`,
        `mediaUrl`,
        `mediaType`,
        `thumbnailUrl`,
        `mediaOrder`,
        `createdAt`,
        `updatedAt`
    )
    SELECT 
        UUID(),
        new_post_id,
        JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))),
        'image',
        JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))),
        idx,
        NOW(),
        NOW()
    FROM (
        SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
    ) numbers
    WHERE JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']')) IS NOT NULL
    AND JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))) IS NOT NULL
    AND JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))) != ''
    AND JSON_LENGTH(NEW.images) > 0;
END$$

-- Swap Deal Update Trigger
CREATE TRIGGER `tr_swap_deal_update_feed` 
AFTER UPDATE ON `swap_deals` 
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
    WHERE `source_table` = 'swap_deals' AND `source_id` = NEW.id;
END$$

-- =====================================================
-- AUCTION TRIGGERS
-- =====================================================

-- Auction to Feed Trigger (FIXED: Uses UUID() instead of LAST_INSERT_ID())
CREATE TRIGGER `tr_auction_to_feed` 
AFTER INSERT ON `auctions` 
FOR EACH ROW 
BEGIN
    DECLARE user_id_var VARCHAR(255);
    DECLARE new_post_id VARCHAR(255);
    
    -- Get the user ID from the seller
    SELECT userId INTO user_id_var 
    FROM sellers 
    WHERE id = NEW.sellerId 
    LIMIT 1;
    
    -- Generate UUID for the post
    SET new_post_id = UUID();
    
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
        new_post_id,
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
    
    -- Insert media into postmedia table using the post UUID
    INSERT INTO `postmedia` (
        `id`,
        `postId`,
        `mediaUrl`,
        `mediaType`,
        `thumbnailUrl`,
        `mediaOrder`,
        `createdAt`,
        `updatedAt`
    )
    SELECT 
        UUID(),
        new_post_id,
        JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))),
        'image',
        JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))),
        idx,
        NOW(),
        NOW()
    FROM (
        SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
    ) numbers
    WHERE JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']')) IS NOT NULL
    AND JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))) IS NOT NULL
    AND JSON_UNQUOTE(JSON_EXTRACT(NEW.images, CONCAT('$[', idx, ']'))) != ''
    AND JSON_LENGTH(NEW.images) > 0;
END$$

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
END$$

-- =====================================================
-- BUYER NEED TRIGGERS
-- =====================================================

-- Buyer Need to Feed Trigger (FIXED: Uses UUID() instead of LAST_INSERT_ID())
CREATE TRIGGER `tr_buyer_need_to_feed` 
AFTER INSERT ON `buyer_needs` 
FOR EACH ROW 
BEGIN
    DECLARE new_post_id VARCHAR(255);
    
    -- Generate UUID for the post
    SET new_post_id = UUID();
    
    -- Insert into posts table
    INSERT INTO `posts` (
        `id`,
        `userId`,
        `postType`,
        `content`,
        `productName`,
        `category`,
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
        new_post_id,
        NEW.buyer_id,  -- buyer_id is already the userId
        'general',
        CONCAT('Product Demand: ', NEW.title, ' - ', COALESCE(NEW.description, '')),
        NEW.title,
        NEW.category,  -- Category stored as string
        NULL,  -- Buyer needs don't have location in the main table
        'Lagos',  -- Set default region (posts table requires NOT NULL)
        'Nigeria',  -- Set default country
        'product_demand',
        NEW.id,
        'buyer_needs',
        TRUE,
        NEW.created_at,
        JSON_OBJECT(
            'buyer_need_id', NEW.id,
            'title', NEW.title,
            'description', NEW.description,
            'category', NEW.category,
            'status', NEW.status,
            'reach_limit', NEW.reach_limit,
            'current_reach', NEW.current_reach,
            'reach_exceeded', IF(NEW.reach_exceeded = 1, TRUE, FALSE),
            'expires_at', NEW.expires_at,
            'is_featured', IF(COALESCE(NEW.is_featured, 0) = 1, TRUE, FALSE)
        ),
        IF(NEW.status = 'active' AND (NEW.expires_at IS NULL OR NEW.expires_at > NOW()), TRUE, FALSE),
        CASE 
            WHEN COALESCE(NEW.is_featured, 0) = 1 THEN 50
            WHEN NEW.status = 'active' AND (NEW.expires_at IS NULL OR NEW.expires_at > NOW()) THEN 25
            ELSE 0
        END,
        CASE 
            WHEN NEW.status = 'cancelled' THEN 'inactive'
            WHEN NEW.status = 'expired' THEN 'inactive'
            WHEN NEW.status = 'fulfilled' THEN 'inactive'
            ELSE 'active'
        END,
        NOW(),
        NOW()
    );
    
    -- Insert media from buyer_need_media table into postmedia table using the post UUID
    INSERT INTO `postmedia` (
        `id`,
        `postId`,
        `mediaUrl`,
        `mediaType`,
        `thumbnailUrl`,
        `mediaOrder`,
        `createdAt`,
        `updatedAt`
    )
    SELECT 
        UUID(),
        new_post_id,
        bnm.mediaUrl,
        bnm.mediaType,
        bnm.mediaUrl,  -- Use mediaUrl as thumbnail
        bnm.mediaOrder,
        NOW(),
        NOW()
    FROM `buyer_need_media` bnm
    WHERE bnm.buyerNeedId = NEW.id
    ORDER BY bnm.mediaOrder ASC;
END$$

-- Buyer Need Update Trigger
CREATE TRIGGER `tr_buyer_need_update_feed` 
AFTER UPDATE ON `buyer_needs` 
FOR EACH ROW 
BEGIN
    UPDATE `posts` 
    SET 
        `feed_visible` = IF(NEW.status = 'active' AND (NEW.expires_at IS NULL OR NEW.expires_at > NOW()), TRUE, FALSE),
        `feed_priority` = CASE 
            WHEN COALESCE(NEW.is_featured, 0) = 1 THEN 50
            WHEN NEW.status = 'active' AND (NEW.expires_at IS NULL OR NEW.expires_at > NOW()) THEN 25
            ELSE 0
        END,
        `status` = CASE 
            WHEN NEW.status = 'cancelled' THEN 'inactive'
            WHEN NEW.status = 'expired' THEN 'inactive'
            WHEN NEW.status = 'fulfilled' THEN 'inactive'
            ELSE 'active'
        END,
        `category` = NEW.category,  -- Update category if changed
        `content` = CONCAT('Product Demand: ', NEW.title, ' - ', COALESCE(NEW.description, '')),
        `productName` = NEW.title,
        `feed_metadata` = JSON_OBJECT(
            'buyer_need_id', NEW.id,
            'title', NEW.title,
            'description', NEW.description,
            'category', NEW.category,
            'status', NEW.status,
            'reach_limit', NEW.reach_limit,
            'current_reach', NEW.current_reach,
            'reach_exceeded', IF(NEW.reach_exceeded = 1, TRUE, FALSE),
            'expires_at', NEW.expires_at,
            'is_featured', IF(COALESCE(NEW.is_featured, 0) = 1, TRUE, FALSE)
        ),
        `updatedAt` = NOW()
    WHERE `source_table` = 'buyer_needs' AND `source_id` = NEW.id;
END$$

-- Buyer Need Media to Feed Trigger
CREATE TRIGGER `tr_buyer_need_media_to_feed` 
AFTER INSERT ON `buyer_need_media` 
FOR EACH ROW 
BEGIN
    DECLARE post_id_var CHAR(36);
    
    -- Find the post for this buyer need
    SELECT `id` INTO post_id_var
    FROM `posts`
    WHERE `source_table` = 'buyer_needs' 
    AND `source_id` = NEW.buyerNeedId
    LIMIT 1;
    
    -- If post exists, add the media to postmedia
    IF post_id_var IS NOT NULL THEN
        INSERT INTO `postmedia` (
            `id`,
            `postId`,
            `mediaUrl`,
            `mediaType`,
            `thumbnailUrl`,
            `mediaOrder`,
            `createdAt`,
            `updatedAt`
        ) VALUES (
            UUID(),
            post_id_var,
            NEW.mediaUrl,
            NEW.mediaType,
            NEW.mediaUrl,  -- Use mediaUrl as thumbnail
            NEW.mediaOrder,
            NOW(),
            NOW()
        );
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify all triggers were created
SHOW TRIGGERS LIKE '%feed%';

-- Check trigger count
SELECT 
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE
FROM INFORMATION_SCHEMA.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE()
AND TRIGGER_NAME LIKE '%feed%'
ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME;
