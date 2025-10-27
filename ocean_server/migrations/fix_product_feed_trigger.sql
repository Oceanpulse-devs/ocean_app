-- Fix Product to Feed Trigger
-- Issue: LAST_INSERT_ID() is used incorrectly in nested INSERT
-- Solution: Use the generated post UUID directly

DELIMITER $$

DROP TRIGGER IF EXISTS `tr_product_to_feed`$$
DROP TRIGGER IF EXISTS `tr_product_images_to_feed`$$

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
        SET post_content_var = CONCAT(NEW.title, ' - ', COALESCE(NEW.description, ''));
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
    -- Only insert if images array exists and has content
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

-- Trigger to add media when product images are updated
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

DELIMITER ;
