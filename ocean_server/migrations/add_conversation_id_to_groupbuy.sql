-- Add conversation_id column to group_buys table to link to messaging system
ALTER TABLE group_buys
ADD COLUMN conversation_id INT NULL COMMENT 'Reference to group conversation in messaging system' AFTER seller_id;

-- Add index for faster lookups
ALTER TABLE group_buys
ADD INDEX idx_conversation_id (conversation_id);

