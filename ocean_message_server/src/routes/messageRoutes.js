const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');

// Get messages for a conversation
router.get('/:conversationId', authMiddleware, messageController.getMessages);

// Send a message
router.post('/', authMiddleware, messageController.sendMessage);

// Edit a message
router.put('/:messageId', authMiddleware, messageController.editMessage);

// Delete a message
router.delete('/:messageId', authMiddleware, messageController.deleteMessage);

// Add reaction to message
router.post('/:messageId/reactions', authMiddleware, messageController.addReaction);

// Remove reaction from message
router.delete('/:messageId/reactions/:reaction', authMiddleware, messageController.removeReaction);

module.exports = router; 