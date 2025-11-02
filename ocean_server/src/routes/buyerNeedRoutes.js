const express = require('express');
const router = express.Router();
const multer = require('multer');
const buyerNeedController = require('../controllers/buyerNeedController');
const buyerNeedResponseController = require('../controllers/buyerNeedResponseController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Configure multer for file uploads (same as posts)
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

// Buyer Need CRUD operations
router.post('/create', upload.array('media', 10), buyerNeedController.createBuyerNeed);
router.get('/all', buyerNeedController.getAllBuyerNeeds);
router.get('/:id', buyerNeedController.getBuyerNeedById);
router.put('/:id', buyerNeedController.updateBuyerNeed);
router.delete('/:id', buyerNeedController.deleteBuyerNeed);

// Buyer Need actions
router.put('/:id/cancel', buyerNeedController.cancelBuyerNeed);
router.put('/:id/fulfill', buyerNeedController.markBuyerNeedFulfilled);

// User-specific buyer needs
router.get('/user/me', buyerNeedController.getUserBuyerNeeds);

// Buyer Need statistics
router.get('/stats/overview', buyerNeedController.getBuyerNeedStats);

// Buyer Search Insights routes
router.post('/search-insight/track', buyerNeedController.trackFailedSearch);
router.get('/search-insights', buyerNeedController.getBuyerSearchInsights);

// Reach management routes
router.post('/:id/increment-reach', buyerNeedController.incrementReach);
router.get('/:id/reach-status', buyerNeedController.getReachStatus);

// Buyer Need Response routes
router.post('/:buyer_need_id/responses', buyerNeedResponseController.createResponse);
router.get('/:buyer_need_id/responses', buyerNeedResponseController.getResponsesByBuyerNeed);
router.get('/responses/:id', buyerNeedResponseController.getResponseById);
router.put('/responses/:id', buyerNeedResponseController.updateResponse);

// Response actions
router.put('/responses/:id/accept', buyerNeedResponseController.acceptResponse);
router.put('/responses/:id/reject', buyerNeedResponseController.rejectResponse);
router.put('/responses/:id/withdraw', buyerNeedResponseController.withdrawResponse);
router.put('/responses/:id/read', buyerNeedResponseController.markResponseAsRead);
router.put('/responses/:id/feedback', buyerNeedResponseController.provideFeedback);

// Seller response management
router.get('/seller/responses', buyerNeedResponseController.getSellerResponses);

module.exports = router;
