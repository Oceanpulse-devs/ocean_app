-- Add missing columns to users table for profile functionality
-- Run these commands in your MySQL GUI or command line

-- Add username column (unique identifier for @username style)
ALTER TABLE users 
ADD COLUMN username VARCHAR(255) UNIQUE AFTER fullName;

-- Add lastActive column (timestamp for last activity)
ALTER TABLE users 
ADD COLUMN lastActive DATETIME DEFAULT CURRENT_TIMESTAMP AFTER website;

-- Update existing users with default username if they don't have one
-- Handle duplicates by adding user ID to make usernames unique
UPDATE users 
SET username = CONCAT('@', LOWER(REPLACE(fullName, ' ', '_')), '_', SUBSTRING(id, 1, 8))
WHERE username IS NULL OR username = '';

-- Update existing users with current timestamp as lastActive if they don't have one
UPDATE users 
SET lastActive = updatedAt 
WHERE lastActive IS NULL;

-- Check and fix user_follows table structure
-- First, let's see what columns exist
-- DESCRIBE user_follows;

-- Drop and recreate user_follows table with correct column names
DROP TABLE IF EXISTS user_follows;

CREATE TABLE user_follows (
    id VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    followsUserId VARCHAR(36) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_follow (userId, followsUserId),
    INDEX idx_userId (userId),
    INDEX idx_followsUserId (followsUserId)
);

-- Add missing columns to products table
-- Note: Run these commands one by one to avoid errors if columns already exist

-- Add likes column
ALTER TABLE products ADD COLUMN likes INT DEFAULT 0 AFTER saves;

-- Add distress sale columns
ALTER TABLE products ADD COLUMN isDistressSale BOOLEAN DEFAULT FALSE AFTER status;
ALTER TABLE products ADD COLUMN originalPrice DECIMAL(10,2) AFTER isDistressSale;
ALTER TABLE products ADD COLUMN discountPercentage DECIMAL(5,2) AFTER originalPrice;
ALTER TABLE products ADD COLUMN urgencyLevel ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' AFTER discountPercentage;
ALTER TABLE products ADD COLUMN distressReason VARCHAR(255) AFTER urgencyLevel;
ALTER TABLE products ADD COLUMN distressExpiryDate DATETIME AFTER distressReason;

-- Verify the changes
DESCRIBE users;
DESCRIBE user_follows;
DESCRIBE products;
