const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Import controller functions
const followController = require('../controllers/followController');

// Follow/Unfollow routes
router.post('/api/follow', authMiddleware, followController.followUser);
router.post('/api/unfollow', authMiddleware, followController.unfollowUser);

// Get followers and following
router.get('/api/users/:userId/followers', followController.getFollowers);
router.get('/api/users/:userId/following', followController.getFollowing);

// Check follow status
router.get('/api/users/:targetUserId/follow-status', authMiddleware, followController.checkFollowStatus);

// Get follow statistics
router.get('/api/users/:userId/follow-stats', followController.getFollowStats);

// Get mutual followers
router.get('/api/users/:userId/mutual-followers', authMiddleware, followController.getMutualFollowers);

module.exports = router; 