-- Fix existing invalid datetime values in users table
-- This script should be run before the server starts to fix the timestamp issues

-- First, update any existing users with invalid timestamps to have current timestamp
UPDATE users 
SET createdAt = NOW(), updatedAt = NOW() 
WHERE createdAt = '0000-00-00 00:00:00' OR createdAt IS NULL;

-- Now add the missing columns if they don't exist
-- Note: These ALTER TABLE statements will only add columns if they don't exist

-- Add password column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255) NOT NULL DEFAULT '';

-- Add agreeTerms column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS agreeTerms BOOLEAN DEFAULT FALSE;

-- Add profilePicture column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profilePicture VARCHAR(500) NULL;

-- Add coverPicture column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS coverPicture VARCHAR(500) NULL;

-- Add bio column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio TEXT NULL;

-- Add location column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location VARCHAR(255) NULL;

-- Add website column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS website VARCHAR(255) NULL;

-- Add createdAt column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updatedAt column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Verify the table structure
DESCRIBE users;













