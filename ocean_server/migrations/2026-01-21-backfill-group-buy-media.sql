-- =====================================================
-- Backfill Group Buy PostMedia Records
-- Date: 2026-01-21
-- Description: Fixes existing group buy posts by creating PostMedia records
--              from product_image data stored in group_buys table
-- =====================================================

-- This script fixes group buy posts created before the tr_group_buy_images_to_feed trigger was added
-- It syncs images from group_buys.product_image to the posts/postmedia tables

-- Step 1: Update feedMetadata.images for all group buy posts
UPDATE `posts` p
INNER JOIN `group_buys` gb ON p.source_id = gb.id AND p.source_table = 'group_buys'
SET p.feed_metadata = JSON_SET(
    COALESCE(p.feed_metadata, JSON_OBJECT()),
    '$.images',
    gb.product_image
)
WHERE gb.product_image IS NOT NULL 
AND JSON_LENGTH(gb.product_image) > 0;

-- Step 2: Create PostMedia records for group buy posts that don't have them
-- This will loop through all group buys with images and create PostMedia records

DELIMITER $$

DROP PROCEDURE IF EXISTS backfill_group_buy_media$$

CREATE PROCEDURE backfill_group_buy_media()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_post_id VARCHAR(255);
    DECLARE v_group_buy_id INT;
    DECLARE v_product_image JSON;
    
    -- Cursor to find all group buy posts that have images in group_buys but no PostMedia
    DECLARE cur CURSOR FOR 
        SELECT p.id, gb.id, gb.product_image
        FROM `posts` p
        INNER JOIN `group_buys` gb ON p.source_id = gb.id AND p.source_table = 'group_buys'
        LEFT JOIN `postmedia` pm ON pm.postId = p.id
        WHERE gb.product_image IS NOT NULL 
        AND JSON_LENGTH(gb.product_image) > 0
        AND pm.id IS NULL
        GROUP BY p.id, gb.id, gb.product_image;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO v_post_id, v_group_buy_id, v_product_image;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Insert PostMedia records for this post
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
            v_post_id,
            JSON_UNQUOTE(JSON_EXTRACT(v_product_image, CONCAT('$[', idx, ']'))),
            'image',
            JSON_UNQUOTE(JSON_EXTRACT(v_product_image, CONCAT('$[', idx, ']'))),
            idx,
            NOW(),
            NOW()
        FROM (
            SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
            UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
        ) numbers
        WHERE JSON_EXTRACT(v_product_image, CONCAT('$[', idx, ']')) IS NOT NULL
        AND JSON_UNQUOTE(JSON_EXTRACT(v_product_image, CONCAT('$[', idx, ']'))) IS NOT NULL
        AND JSON_UNQUOTE(JSON_EXTRACT(v_product_image, CONCAT('$[', idx, ']'))) != '';
        
    END LOOP;
    
    CLOSE cur;
END$$

DELIMITER ;

-- Execute the backfill procedure
CALL backfill_group_buy_media();

-- Clean up
DROP PROCEDURE IF EXISTS backfill_group_buy_media;

-- =====================================================
-- Verification Query
-- =====================================================

-- Run this to verify the fix worked:
SELECT 
    gb.id AS group_buy_id,
    gb.title,
    p.id AS post_id,
    JSON_LENGTH(gb.product_image) AS group_buy_images_count,
    COUNT(pm.id) AS postmedia_count,
    JSON_EXTRACT(p.feed_metadata, '$.images') AS feed_metadata_images
FROM `group_buys` gb
INNER JOIN `posts` p ON p.source_id = gb.id AND p.source_table = 'group_buys'
LEFT JOIN `postmedia` pm ON pm.postId = p.id
WHERE gb.product_image IS NOT NULL AND JSON_LENGTH(gb.product_image) > 0
GROUP BY gb.id, gb.title, p.id, gb.product_image, p.feed_metadata
ORDER BY gb.id DESC
LIMIT 20;

-- Expected result: postmedia_count should match group_buy_images_count

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
