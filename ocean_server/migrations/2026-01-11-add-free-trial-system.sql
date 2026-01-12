-- =============================================
-- FREE TRIAL SYSTEM MIGRATION
-- Created: 2026-01-11
-- Description: Adds 30-day free trial support to subscription system
-- =============================================

-- 1. Add trial tracking fields to user_subscriptions table
ALTER TABLE user_subscriptions 
ADD COLUMN is_trial BOOLEAN DEFAULT FALSE COMMENT 'Is this a free trial subscription',
ADD COLUMN trial_start_date TIMESTAMP NULL COMMENT 'When trial started',
ADD COLUMN trial_end_date TIMESTAMP NULL COMMENT 'When trial expires (30 days)',
ADD COLUMN has_used_trial BOOLEAN DEFAULT FALSE COMMENT 'User already used trial for this subscription';

-- 2. Add indexes for trial fields (improves query performance)
ALTER TABLE user_subscriptions
ADD INDEX idx_trial_end_date (trial_end_date),
ADD INDEX idx_is_trial (is_trial);

-- 3. Add trial tracking fields to users table (prevents multiple trials)
ALTER TABLE users
ADD COLUMN has_used_trial BOOLEAN DEFAULT FALSE COMMENT 'Track if user ever had trial (lifetime)',
ADD COLUMN trial_plan_used VARCHAR(50) NULL COMMENT 'Which plan they trialed (drift/wave/tide/surge)';

-- 4. Add index for has_used_trial (improves eligibility checks)
ALTER TABLE users
ADD INDEX idx_has_used_trial (has_used_trial);

-- =============================================
-- VERIFICATION QUERIES (Run these to confirm)
-- =============================================

-- Verify user_subscriptions columns were added
SHOW COLUMNS FROM user_subscriptions LIKE '%trial%';

-- Verify users columns were added
SHOW COLUMNS FROM users LIKE '%trial%';

-- Verify indexes were created
SHOW INDEX FROM user_subscriptions WHERE Key_name LIKE '%trial%';
SHOW INDEX FROM users WHERE Key_name = 'idx_has_used_trial';

-- Check current schema
DESCRIBE user_subscriptions;
DESCRIBE users;
