-- Add missing password column to users table
ALTER TABLE users 
ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '';

-- Note: After running this migration, you'll need to update existing users with proper passwords
-- or reset their passwords through the forgot password functionality


