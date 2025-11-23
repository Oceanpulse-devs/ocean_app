-- =====================================================
-- BUYER NEED TO FEED TRIGGERS
-- =====================================================
-- This migration adds triggers to automatically create feed posts
-- when buyer needs are created or updated
-- =====================================================

DELIMITER $$

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS `tr_buyer_need_to_feed`$$
DROP TRIGGER IF EXISTS `tr_buyer_need_update_feed`$$
DROP TRIGGER IF EXISTS `tr_buyer_need_media_to_feed`$$

-- Buyer Need to Feed Trigger
CREATE TRIGGER `tr_buyer_need_to_feed` 
AFTER INSERT ON `buyer_needs` 
FOR EACH ROW 
BEGIN
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
        UUID(),
        NEW.buyer_id,  -- buyer_id is already the userId
        'general',
        CONCAT('Product Demand: ', NEW.title, ' - ', COALESCE(NEW.description, '')),
        NEW.title,
        NEW.category,  -- Category stored as string
        NULL,  -- Buyer needs don't have location in the main table
        NULL,
        'Nigeria',
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
    
    -- Insert media from buyer_need_media table into postmedia table
    -- Note: Using a subquery to get all media for this buyer need
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
        bnm.mediaUrl,
        bnm.mediaType,
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
    
    -- Note: Media updates are handled separately if needed
    -- The media is inserted once when the buyer need is created
    -- If media needs to be updated, it should be done through a separate process
END$$

-- Buyer Need Media to Feed Trigger
-- This trigger handles media that is added after the buyer need is created
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
            `createdAt`,
            `updatedAt`
        ) VALUES (
            UUID(),
            post_id_var,
            NEW.mediaUrl,
            NEW.mediaType,
            NOW(),
            NOW()
        );
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

