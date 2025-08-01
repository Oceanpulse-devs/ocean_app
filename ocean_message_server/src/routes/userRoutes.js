const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// Get online users
router.get('/online', authMiddleware, userController.getOnlineUsers);

// Search users
router.get('/search', authMiddleware, userController.searchUsers);

// Get user profile
router.get('/:userId', authMiddleware, userController.getUserProfile);



// Get recent contacts
router.get('/recent/contacts', authMiddleware, userController.getRecentContacts);

// Get conversation stats
router.get('/stats/conversations', authMiddleware, userController.getConversationStats);

module.exports = router; 