const express = require('express');
const router = express.Router();
const SellerFeedbackController = require('../controllers/sellerFeedbackController');
const authMiddleware = require('../middleware/authMiddleware');

// Seller feedback routes
// Note: More specific routes (summary) must come before parameterized routes (sellerId)
router.post('/', authMiddleware, SellerFeedbackController.createFeedback);
router.get('/:sellerId/summary', authMiddleware, SellerFeedbackController.getFeedbackSummary);
router.get('/:sellerId', authMiddleware, SellerFeedbackController.getFeedbackList);
router.post('/:feedbackId/like', authMiddleware, SellerFeedbackController.toggleFeedbackLike);
router.post('/:feedbackId/response', authMiddleware, SellerFeedbackController.createResponse);
router.post('/response/:responseId/like', authMiddleware, SellerFeedbackController.toggleResponseLike);
router.delete('/:feedbackId', authMiddleware, SellerFeedbackController.deleteFeedback);

module.exports = router;

