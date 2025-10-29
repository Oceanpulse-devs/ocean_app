-- Change conversation_id column from INTEGER to VARCHAR for UUID support
-- The messaging server uses UUIDs for conversation IDs

ALTER TABLE group_buys
MODIFY COLUMN conversation_id VARCHAR(36) NULL COMMENT 'Reference to group conversation in messaging system (UUID)';

