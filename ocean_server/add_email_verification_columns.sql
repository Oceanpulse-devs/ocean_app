ALTER TABLE users ADD COLUMN emailVerified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN emailVerificationToken VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN emailVerificationExpires DATETIME NULL;
ALTER TABLE users ADD COLUMN passwordResetToken VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN passwordResetExpires DATETIME NULL;
ALTER TABLE users MODIFY COLUMN accountStatus ENUM('pending', 'active', 'suspended', 'deactivated') DEFAULT 'pending';
UPDATE users SET emailVerified = TRUE, accountStatus = 'active' WHERE id IS NOT NULL;