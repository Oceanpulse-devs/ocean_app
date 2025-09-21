const express = require('express');
const router = express.Router();
const sellerVerificationController = require('../controllers/sellerVerificationController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only for verification documents
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for verification documents'), false);
    }
  }
});

// Public routes (no authentication required)
router.get('/requirements', sellerVerificationController.getVerificationRequirements);

// Protected routes (authentication required)
router.post('/submit', authMiddleware, upload.array('documents', 5), sellerVerificationController.submitVerification);
router.get('/status', authMiddleware, sellerVerificationController.getVerificationStatus);

// Admin routes (admin authentication required)
router.post('/admin/review', authMiddleware, sellerVerificationController.reviewVerification);
router.get('/admin/stats', authMiddleware, sellerVerificationController.getVerificationStats);

module.exports = router;
