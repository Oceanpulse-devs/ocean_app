const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const feedController = require('../controllers/feedcontroller');

// Test route to check if server is working
router.get('/api/test', (req, res) => {
  res.json({ message: 'Feed routes are working!' });
});

// Public routes (no authentication required)
router.get('/api/home-feed', authMiddleware, feedController.getHomeFeed);
router.get('/api/feed', feedController.getFeed);
router.get('/api/posts/:postId', feedController.getPost);
router.get('/api/search', feedController.searchPosts);

// Protected routes (authentication required)
const customFileParser = require('../middleware/customFileParser');

// Unified route that handles both JSON and form-data
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit (for videos)
    files: 10 // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// Single flexible route for post creation - handles both JSON and form-data
router.post('/api/posts', authMiddleware, upload.array('media', 10), feedController.createPost);

router.put('/api/posts/:postId', authMiddleware, (req, res, next) => {
  // Use multer for file uploads
  const upload = req.app.locals.upload;
  upload.array('media', 10)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'Too many files. Maximum is 10 files.' });
      }
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, feedController.updatePost);

router.delete('/api/posts/:postId', authMiddleware, feedController.deletePost);
router.post('/api/posts/:postId/like', authMiddleware, feedController.toggleLike);
router.post('/api/posts/:postId/save', authMiddleware, feedController.toggleSave);
router.get('/api/saved-posts', authMiddleware, feedController.getSavedPosts);

// Comment routes
router.post('/api/posts/:postId/comments', authMiddleware, feedController.createComment);
router.get('/api/posts/:postId/comments', feedController.getComments);
router.put('/api/comments/:commentId', authMiddleware, feedController.updateComment);
router.delete('/api/comments/:commentId', authMiddleware, feedController.deleteComment);

// User posts route
router.get('/api/users/:userId/posts', feedController.getUserPosts);

module.exports = router; 