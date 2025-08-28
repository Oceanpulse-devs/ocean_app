-- =====================================================
-- PRODUCTION SCHEMA FIX FOR OCEAN APP
-- This script fixes all database schema mismatches
-- =====================================================

-- 1. FIX SELLERS TABLE - Add missing verification columns
ALTER TABLE sellers 
ADD COLUMN verificationExpiresAt DATETIME NULL COMMENT 'When verification expires and needs renewal',
ADD COLUMN verificationLevel ENUM('basic', 'premium', 'enterprise') DEFAULT 'basic' COMMENT 'Level of verification achieved',
ADD COLUMN verificationScore INT DEFAULT 0 COMMENT 'Overall verification score (0-100)',
ADD COLUMN verificationNotes TEXT NULL COMMENT 'Admin notes about verification process',
ADD COLUMN rejectionReason TEXT NULL COMMENT 'Reason for rejection if verification failed',
ADD COLUMN documentsSubmitted INT DEFAULT 0 COMMENT 'Number of verification documents submitted',
ADD COLUMN documentsApproved INT DEFAULT 0 COMMENT 'Number of verification documents approved',
ADD COLUMN lastVerificationCheck DATETIME NULL COMMENT 'Last time verification was reviewed',
ADD COLUMN verifiedSellerBenefits JSON NULL COMMENT 'Array of benefits this verified seller has access to',
ADD COLUMN trustScore INT DEFAULT 0 COMMENT 'Trust score based on verification, sales, and reviews (0-100)';

-- 2. FIX POSTS TABLE - Ensure all required columns exist
-- Check if posts table has the correct structure
DESCRIBE posts;

-- 3. FIX POSTMEDIA TABLE - Ensure correct structure
-- Check if postmedia table exists and has correct structure
DESCRIBE postmedia;

-- 4. FIX POSTLIKES TABLE - Ensure correct structure
-- Check if postlikes table exists and has correct structure
DESCRIBE postlikes;

-- 5. FIX POSTCOMMENTS TABLE - Ensure correct structure
-- Check if postcomments table exists and has correct structure
DESCRIBE postcomments;

-- 6. FIX POSTSHARES TABLE - Ensure correct structure
-- Check if postshares table exists and has correct structure
DESCRIBE postshares;

-- 7. FIX SAVEDPOSTS TABLE - Ensure correct structure
-- Check if savedposts table exists and has correct structure
DESCRIBE savedposts;

-- 8. FIX USER_FOLLOWS TABLE - Ensure correct structure
-- Check if user_follows table exists and has correct structure
DESCRIBE user_follows;

-- 9. ADD MISSING TABLES IF THEY DON'T EXIST

-- Create postmedia table if it doesn't exist
CREATE TABLE IF NOT EXISTS postmedia (
    id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    postId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    mediaType ENUM('image', 'video') NOT NULL DEFAULT 'image',
    mediaUrl VARCHAR(500) NOT NULL,
    thumbnailUrl VARCHAR(500) NULL,
    mediaOrder INT NOT NULL DEFAULT 0,
    altText VARCHAR(255) NULL,
    fileSize INT NULL,
    duration INT NULL COMMENT 'Duration in seconds for videos',
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY postId (postId),
    CONSTRAINT postmedia_postId_foreign_idx FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create postlikes table if it doesn't exist
CREATE TABLE IF NOT EXISTS postlikes (
    id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    postId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    userId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_post_user (postId, userId),
    KEY postId (postId),
    KEY userId (userId),
    CONSTRAINT postlikes_postId_foreign_idx FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT postlikes_userId_foreign_idx FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create postcomments table if it doesn't exist
CREATE TABLE IF NOT EXISTS postcomments (
    id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    postId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    userId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    parentCommentId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
    content TEXT NOT NULL,
    mediaUrl VARCHAR(500) NULL,
    mediaType ENUM('image', 'video') NULL,
    likesCount INT DEFAULT 0,
    status ENUM('active', 'hidden', 'deleted') DEFAULT 'active',
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY postId (postId),
    KEY userId (userId),
    KEY parentCommentId (parentCommentId),
    KEY status (status),
    CONSTRAINT postcomments_postId_foreign_idx FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT postcomments_userId_foreign_idx FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT postcomments_parentCommentId_foreign_idx FOREIGN KEY (parentCommentId) REFERENCES postcomments(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create postshares table if it doesn't exist
CREATE TABLE IF NOT EXISTS postshares (
    id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    postId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    userId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    shareType ENUM('internal', 'external', 'social') DEFAULT 'internal',
    sharePlatform VARCHAR(50) NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_post_user (postId, userId),
    KEY postId (postId),
    KEY userId (userId),
    CONSTRAINT postshares_postId_foreign_idx FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT postshares_userId_foreign_idx FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create savedposts table if it doesn't exist
CREATE TABLE IF NOT EXISTS savedposts (
    id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    postId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    userId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    collectionName VARCHAR(100) DEFAULT 'General',
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_post_user (postId, userId),
    KEY postId (postId),
    KEY userId (userId),
    CONSTRAINT savedposts_postId_foreign_idx FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT savedposts_userId_foreign_idx FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create user_follows table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_follows (
    id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    userId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    followsUserId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_follow (userId, followsUserId),
    KEY userId (userId),
    KEY followsUserId (followsUserId),
    CONSTRAINT user_follows_userId_foreign_idx FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT user_follows_followsUserId_foreign_idx FOREIGN KEY (followsUserId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 10. VERIFY ALL TABLES HAVE CORRECT STRUCTURE
SHOW TABLES;

-- 11. CHECK FOREIGN KEY CONSTRAINTS
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE 
    REFERENCED_TABLE_SCHEMA = 'ocean_app_db' 
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY 
    TABLE_NAME, COLUMN_NAME;

-- 12. FINAL VERIFICATION - Check if all required columns exist
SELECT 'posts' as table_name, COUNT(*) as column_count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ocean_app_db' AND TABLE_NAME = 'posts'
UNION ALL
SELECT 'postmedia', COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ocean_app_db' AND TABLE_NAME = 'postmedia'
UNION ALL
SELECT 'postlikes', COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ocean_app_db' AND TABLE_NAME = 'postlikes'
UNION ALL
SELECT 'postcomments', COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ocean_app_db' AND TABLE_NAME = 'postcomments'
UNION ALL
SELECT 'postshares', COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ocean_app_db' AND TABLE_NAME = 'postshares'
UNION ALL
SELECT 'savedposts', COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ocean_app_db' AND TABLE_NAME = 'savedposts'
UNION ALL
SELECT 'user_follows', COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ocean_app_db' AND TABLE_NAME = 'user_follows'
UNION ALL
SELECT 'sellers', COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ocean_app_db' AND TABLE_NAME = 'sellers';








