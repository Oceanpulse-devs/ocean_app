-- Add distress sale fields to products table
ALTER TABLE products 
ADD COLUMN isDistressSale BOOLEAN DEFAULT FALSE COMMENT 'Whether this is a distress sale item',
ADD COLUMN originalPrice DECIMAL(10, 2) NULL COMMENT 'Original price before discount',
ADD COLUMN discountPercentage DECIMAL(5, 2) NULL COMMENT 'Discount percentage applied',
ADD COLUMN urgencyLevel ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT 'Urgency level of the distress sale',
ADD COLUMN distressReason VARCHAR(255) NULL COMMENT 'Reason for distress sale (moving, financial, etc.)',
ADD COLUMN distressExpiryDate DATETIME NULL COMMENT 'When the distress sale expires';

-- Add indexes for better performance
CREATE INDEX idx_products_isDistressSale ON products(isDistressSale);
CREATE INDEX idx_products_urgencyLevel ON products(urgencyLevel);
CREATE INDEX idx_products_discountPercentage ON products(discountPercentage);

-- Add constraint to ensure discount_percentage is between 0 and 100
ALTER TABLE products 
ADD CONSTRAINT chk_discount_percentage 
CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

-- Add constraint to ensure original_price is greater than or equal to price when it's a distress sale
ALTER TABLE products 
ADD CONSTRAINT chk_distress_pricing 
CHECK (
  (is_distress_sale = FALSE) OR 
  (is_distress_sale = TRUE AND original_price >= price)
);
