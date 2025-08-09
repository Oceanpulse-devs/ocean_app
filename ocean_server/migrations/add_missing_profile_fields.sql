-- Add missing profile fields to users table
ALTER TABLE users 
ADD COLUMN coverPicture VARCHAR(500) NULL,
ADD COLUMN bio TEXT NULL,
ADD COLUMN location VARCHAR(255) NULL,
ADD COLUMN website VARCHAR(255) NULL;

