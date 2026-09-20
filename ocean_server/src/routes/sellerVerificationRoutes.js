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
router.get('/requirements', (req, res) => sellerVerificationController.getVerificationRequirements(req, res));

// Protected routes (authentication required)
router.post('/verify-nin', authMiddleware, (req, res) => sellerVerificationController.verifySellerNinWithDojah(req, res));
router.post('/nin', authMiddleware, (req, res) => sellerVerificationController.verifySellerNinWithDojah(req, res));
router.post('/submit', authMiddleware, upload.fields([
  { name: 'businessDocument', maxCount: 1 },
  { name: 'personalId', maxCount: 1 }
]), (req, res) => sellerVerificationController.submitVerification(req, res));
router.get('/status', authMiddleware, (req, res) => sellerVerificationController.getVerificationStatus(req, res));

// Admin routes (admin authentication required)
router.post('/admin/review', authMiddleware, (req, res) => sellerVerificationController.reviewVerification(req, res));
router.get('/admin/stats', authMiddleware, (req, res) => sellerVerificationController.getVerificationStats(req, res));

module.exports = router;
