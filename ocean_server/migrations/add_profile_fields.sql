-- Add profile fields to users table
ALTER TABLE users 
ADD COLUMN profilePicture VARCHAR(255) NULL,
ADD COLUMN coverPicture VARCHAR(255) NULL,
ADD COLUMN bio TEXT NULL,
ADD COLUMN location VARCHAR(255) NULL,
ADD COLUMN website VARCHAR(255) NULL;

