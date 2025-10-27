-- Add businessName column to users table for sellers
-- This allows sellers to have their business name stored in the main user table

ALTER TABLE users 
ADD COLUMN businessName VARCHAR(255) NULL COMMENT 'Business name for sellers';

-- Update existing sellers to populate businessName from SellersTable
UPDATE users u
INNER JOIN sellers s ON u.id = s.userId
SET u.businessName = s.businessName
WHERE s.businessName IS NOT NULL AND u.businessName IS NULL;

