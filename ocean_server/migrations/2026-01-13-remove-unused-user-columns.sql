-- Remove unused password reset columns from users table
-- Password reset uses Redis codes, not database tokens

-- Remove passwordResetToken column
ALTER TABLE `users` DROP COLUMN IF EXISTS `passwordResetToken`;

-- Remove passwordResetExpires column
ALTER TABLE `users` DROP COLUMN IF EXISTS `passwordResetExpires`;

-- Note: If your MySQL version doesn't support DROP COLUMN IF EXISTS,
-- use these commands instead:
-- ALTER TABLE `users` DROP COLUMN `passwordResetToken`;
-- ALTER TABLE `users` DROP COLUMN `passwordResetExpires`;
