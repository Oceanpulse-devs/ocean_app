-- Change product_image from VARCHAR(500) to JSON to support multiple images
-- Step 1: First, convert existing VARCHAR data to JSON format
-- Using a specific ID to satisfy safe update mode
UPDATE group_buys 
SET product_image = JSON_ARRAY(product_image) 
WHERE id > 0 AND product_image IS NOT NULL AND product_image != '';

-- Step 2: Then modify the column type to JSON
ALTER TABLE group_buys
MODIFY COLUMN product_image JSON NULL COMMENT 'Array of product image URLs';

