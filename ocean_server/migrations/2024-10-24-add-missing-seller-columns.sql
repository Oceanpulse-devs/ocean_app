-- Migration: Add missing columns to sellers table
-- Date: 2024-10-24
-- Description: Add businessDescription, selectedCategories, selectedSubcategories, businessEmail, businessPhone columns

-- Add businessDescription column
ALTER TABLE sellers 
ADD COLUMN businessDescription TEXT COMMENT 'Detailed business description';

-- Add selectedCategories column (JSON array)
ALTER TABLE sellers 
ADD COLUMN selectedCategories JSON COMMENT 'Array of selected main categories';

-- Add selectedSubcategories column (JSON object)
ALTER TABLE sellers 
ADD COLUMN selectedSubcategories JSON COMMENT 'Object mapping categories to subcategories';

-- Add businessEmail column
ALTER TABLE sellers 
ADD COLUMN businessEmail VARCHAR(255) COMMENT 'Business-specific email address';

-- Add businessPhone column
ALTER TABLE sellers 
ADD COLUMN businessPhone VARCHAR(50) COMMENT 'Business-specific phone number';

-- Add indexes for better performance
CREATE INDEX idx_sellers_business_email ON sellers(businessEmail);
CREATE INDEX idx_sellers_business_phone ON sellers(businessPhone);
