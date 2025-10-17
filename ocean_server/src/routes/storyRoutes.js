const express = require('express');
const router = express.Router();
const multer = require('multer');
const StoryController = require('../controllers/storyController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for story media uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit (for videos)
    },
    fileFilter: function (req, file, cb) {
        // Accept images and videos
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed'), false);
        }
    }
});

// Story routes with individual authentication
router.post('/', (req, res, next) => {
    console.log('🎬 Story route hit - POST /api/stories');
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);
    next();
}, authMiddleware, upload.array('media', 1), StoryController.createStory);
router.get('/all', authMiddleware, StoryController.getAllStories);
router.get('/my', authMiddleware, StoryController.getMyStories);
router.get('/user/:userId', authMiddleware, StoryController.getUserStories);
router.post('/:storyId/view', authMiddleware, StoryController.viewStory);
router.get('/:storyId/viewers', authMiddleware, StoryController.getStoryViewers);
router.delete('/:storyId', authMiddleware, StoryController.deleteStory);

module.exports = router;
