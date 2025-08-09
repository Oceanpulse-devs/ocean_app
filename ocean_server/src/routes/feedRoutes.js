const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const feedController = require('../controllers/feedController');

// Public routes (no authentication required)
router.get('/api/feed', feedController.getFeed);
router.get('/api/posts/:postId', feedController.getPost);
router.get('/api/search', feedController.searchPosts);

// Protected routes (authentication required)
router.post('/api/posts', authMiddleware, feedController.createPost);
router.post('/api/posts/:postId/like', authMiddleware, feedController.toggleLike);
router.post('/api/posts/:postId/save', authMiddleware, feedController.toggleSave);
router.get('/api/saved-posts', authMiddleware, feedController.getSavedPosts);

// Comment routes
router.post('/api/posts/:postId/comments', authMiddleware, feedController.createComment);
router.get('/api/posts/:postId/comments', feedController.getComments);
router.delete('/api/comments/:commentId', authMiddleware, feedController.deleteComment);

module.exports = router; 