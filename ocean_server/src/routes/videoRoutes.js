const express = require('express');
const router = express.Router();
const multer = require('multer');
const VideoController = require('../controllers/videoController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for video uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit for videos
    },
    fileFilter: function (req, file, cb) {
        // Accept only video files
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed'), false);
        }
    }
});

// Video routes
router.post('/', authMiddleware, upload.single('video'), VideoController.createVideo);
router.get('/', authMiddleware, VideoController.getVideos);
router.get('/:id', authMiddleware, VideoController.getVideoById);
router.post('/:id/like', authMiddleware, VideoController.likeVideo);
router.post('/:id/view', authMiddleware, VideoController.viewVideo);
router.post('/:id/comments', authMiddleware, VideoController.addComment);
router.get('/:id/comments', authMiddleware, VideoController.getComments);
router.post('/comments/:commentId/like', authMiddleware, VideoController.likeComment);
router.delete('/:id', authMiddleware, VideoController.deleteVideo);

module.exports = router;

