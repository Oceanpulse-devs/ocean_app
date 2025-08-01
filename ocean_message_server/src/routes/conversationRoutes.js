const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const conversationController = require('../controllers/conversationController');

// Get user's conversations
router.get('/', authMiddleware, conversationController.getConversations);

// Create new conversation
router.post('/', authMiddleware, conversationController.createConversation);

// Get single conversation
router.get('/:conversationId', authMiddleware, conversationController.getConversation);

// Update conversation
router.put('/:conversationId', authMiddleware, conversationController.updateConversation);

// Add participant to conversation
router.post('/:conversationId/participants', authMiddleware, conversationController.addParticipant);

// Remove participant from conversation
router.delete('/:conversationId/participants/:userId', authMiddleware, conversationController.removeParticipant);

// Mark conversation as read
router.post('/:conversationId/read', authMiddleware, conversationController.markAsRead);

module.exports = router; 