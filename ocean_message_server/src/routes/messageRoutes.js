const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');

// Allowed image MIME types and extensions
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'];
const path = require('path');

// Memory storage with strict image filter (10MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit for chat images
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();

    if (!ALLOWED_IMAGE_EXTS.includes(ext) || !ALLOWED_IMAGE_MIMES.includes(mime)) {
      const err = new Error('Invalid file type. Only image files (JPEG, PNG, WEBP, GIF, HEIC) are allowed.');
      err.code = 'INVALID_FILE_TYPE';
      return cb(err, false);
    }
    cb(null, true);
  }
});

// Middleware accepting 'media', 'file', or 'image' field name
const handleMediaUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Image too large. Maximum size is 10MB.' });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (req.files && req.files.length > 0) {
      req.file = req.files.find(f => f.fieldname === 'media') || req.files[0];
    }
    next();
  });
};

// Upload media attachment (POST /api/messages/upload) - strictly images only
router.post('/upload', authMiddleware, handleMediaUpload, messageController.uploadMedia);

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