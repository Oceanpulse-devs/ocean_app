const express = require('express');
const router = express.Router();
const userBlockController = require('../controllers/userBlockController');
const authMiddleware = require('../middleware/authMiddleware');

// All block routes require authentication
router.post('/block/:targetUserId', authMiddleware, userBlockController.blockUser);
router.post('/unblock/:targetUserId', authMiddleware, userBlockController.unblockUser);
router.get('/blocked', authMiddleware, userBlockController.getBlockedUsers);

module.exports = router;
