-- Migration: Add username, lastActive, likes, and posts columns
-- Date: 2024-01-20
-- Description: Sync Railway database with local database schema

-- Add username and lastActive columns to users table
ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE NULL;
ALTER TABLE users ADD COLUMN lastActive TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add likes column to products table
ALTER TABLE products ADD COLUMN likes INT DEFAULT 0;

-- Add new columns to posts table
ALTER TABLE posts ADD COLUMN postSubType ENUM('buyer', 'seller') NULL;
ALTER TABLE posts ADD COLUMN minBudget DECIMAL(10, 2) NULL;
ALTER TABLE posts ADD COLUMN maxBudget DECIMAL(10, 2) NULL;
ALTER TABLE posts ADD COLUMN category VARCHAR(100) NULL;
ALTER TABLE posts ADD COLUMN `condition` VARCHAR(50) NULL;

-- Update existing users with generated usernames
UPDATE users 
SET username = CONCAT('@', SUBSTRING(email, 1, LOCATE('@', email) - 1), '_', SUBSTRING(UUID(), 1, 8))
WHERE username IS NULL;


