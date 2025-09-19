-- Add distress sale columns to products table
ALTER TABLE products ADD COLUMN isDistressSale BOOLEAN DEFAULT FALSE COMMENT 'Whether this is a distress sale item';
ALTER TABLE products ADD COLUMN originalPrice DECIMAL(10, 2) NULL COMMENT 'Original price before discount';
ALTER TABLE products ADD COLUMN discountPercentage DECIMAL(5, 2) NULL COMMENT 'Discount percentage applied';
ALTER TABLE products ADD COLUMN urgencyLevel ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT 'Urgency level of the distress sale';
ALTER TABLE products ADD COLUMN distressReason VARCHAR(255) NULL COMMENT 'Reason for distress sale (moving, financial, etc.)';
ALTER TABLE products ADD COLUMN distressExpiryDate DATETIME NULL COMMENT 'When the distress sale expires';

