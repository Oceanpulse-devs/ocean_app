const express = require('express');
const router = express.Router();
const sellerVerificationController = require('../controllers/sellerVerificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.get('/requirements', sellerVerificationController.getVerificationRequirements);

// Protected routes (authentication required)
router.post('/submit', authMiddleware, sellerVerificationController.submitVerification);
router.get('/status', authMiddleware, sellerVerificationController.getVerificationStatus);

// Admin routes (admin authentication required)
router.post('/admin/review', authMiddleware, sellerVerificationController.reviewVerification);
router.get('/admin/stats', authMiddleware, sellerVerificationController.getVerificationStats);

module.exports = router;
