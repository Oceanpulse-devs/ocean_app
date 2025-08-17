-- Migration: Add distress sale fields to products table
-- Date: 2024-01-15
-- Description: Adds fields to support distress sales with discounts and urgency

ALTER TABLE products 
ADD COLUMN is_distress_sale BOOLEAN DEFAULT FALSE COMMENT 'Whether this is a distress sale item',
ADD COLUMN original_price DECIMAL(10, 2) NULL COMMENT 'Original price before discount',
ADD COLUMN discount_percentage DECIMAL(5, 2) NULL COMMENT 'Discount percentage applied',
ADD COLUMN urgency_level ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT 'Urgency level of the distress sale',
ADD COLUMN distress_reason VARCHAR(255) NULL COMMENT 'Reason for distress sale (moving, financial, etc.)',
ADD COLUMN distress_expiry_date DATETIME NULL COMMENT 'When the distress sale expires';

-- Add indexes for better performance
CREATE INDEX idx_products_distress_sale ON products(is_distress_sale);
CREATE INDEX idx_products_urgency_level ON products(urgency_level);
CREATE INDEX idx_products_discount_percentage ON products(discount_percentage);

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
