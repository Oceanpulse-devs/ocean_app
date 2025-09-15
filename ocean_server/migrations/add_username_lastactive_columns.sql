-- Add username and lastActive columns to users table
-- This migration will sync the local database changes to Railway production

-- Add username column
ALTER TABLE users 
ADD COLUMN username VARCHAR(50) UNIQUE NULL;

-- Add lastActive column
ALTER TABLE users 
ADD COLUMN lastActive TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing users with generated usernames
-- This will create usernames from email addresses for existing users
UPDATE users 
SET username = CONCAT('@', SUBSTRING(email, 1, LOCATE('@', email) - 1), '_', SUBSTRING(UUID(), 1, 8))
WHERE username IS NULL;

-- Add likes column to products table
ALTER TABLE products 
ADD COLUMN likes INT DEFAULT 0;

-- Add postSubType, minBudget, maxBudget, category, condition columns to posts table
ALTER TABLE posts 
ADD COLUMN postSubType ENUM('buyer', 'seller') NULL,
ADD COLUMN minBudget DECIMAL(10, 2) NULL,
ADD COLUMN maxBudget DECIMAL(10, 2) NULL,
ADD COLUMN category VARCHAR(100) NULL,
ADD COLUMN condition VARCHAR(50) NULL;

-- Create user_follows table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_follows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    followsUserId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followsUserId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (userId, followsUserId)
);

-- Create saved_products table if it doesn't exist
CREATE TABLE IF NOT EXISTS saved_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    productId INT NOT NULL,
    collectionName VARCHAR(100) DEFAULT 'default',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_saved_product (userId, productId)
);

-- Create saved_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS saved_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    postId INT NOT NULL,
    collectionName VARCHAR(100) DEFAULT 'default',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_saved_post (userId, postId)
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error', 'admin') DEFAULT 'info',
    category ENUM('seller_application', 'account_status', 'password_reset', 'admin_action', 'system') DEFAULT 'system',
    isRead BOOLEAN DEFAULT FALSE,
    metadata JSON NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
