-- Add all missing columns to users table
-- This migration adds the columns that the application expects but are missing from the database

-- Add password column
ALTER TABLE users 
ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '';

-- Add profile-related columns
ALTER TABLE users 
ADD COLUMN agreeTerms BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN profilePicture VARCHAR(500) NULL;

ALTER TABLE users 
ADD COLUMN coverPicture VARCHAR(500) NULL;

ALTER TABLE users 
ADD COLUMN bio TEXT NULL;

ALTER TABLE users 
ADD COLUMN location VARCHAR(255) NULL;

ALTER TABLE users 
ADD COLUMN website VARCHAR(255) NULL;

-- Add timestamp columns if they don't exist
ALTER TABLE users 
ADD COLUMN createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE users 
ADD COLUMN updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Note: After running this migration, existing users will have:
-- - Empty password (they'll need to reset it)
-- - Default values for other fields
-- - Current timestamp for createdAt and updatedAt



