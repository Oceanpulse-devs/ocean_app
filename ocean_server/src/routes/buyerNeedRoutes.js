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
router.post('/create', upload.array('images', 10), (req, res) => buyerNeedController.createBuyerNeed(req, res));
router.get('/all', (req, res) => buyerNeedController.getAllBuyerNeeds(req, res));

// User-specific buyer needs (must come before /:id)
router.get('/user/me', (req, res) => buyerNeedController.getUserBuyerNeeds(req, res));

// Buyer Need statistics (must come before /:id)
router.get('/stats/overview', (req, res) => buyerNeedController.getBuyerNeedStats(req, res));

// Buyer Search Insights routes (must come before /:id)
router.post('/search-insight/track', (req, res) => buyerNeedController.trackFailedSearch(req, res));
router.get('/search-insights', (req, res) => buyerNeedController.getBuyerSearchInsights(req, res));

// Seller response management (must come before /:id routes)
router.get('/seller/responses', (req, res) => buyerNeedResponseController.getSellerResponses(req, res));

// Parameterized routes (must come after all specific routes)
router.get('/:id', (req, res) => buyerNeedController.getBuyerNeedById(req, res));
router.put('/:id', (req, res) => buyerNeedController.updateBuyerNeed(req, res));
router.delete('/:id', (req, res) => buyerNeedController.deleteBuyerNeed(req, res));

// Buyer Need actions
router.put('/:id/cancel', (req, res) => buyerNeedController.cancelBuyerNeed(req, res));
router.put('/:id/fulfill', (req, res) => buyerNeedController.markBuyerNeedFulfilled(req, res));

// Reach management routes
router.post('/:id/increment-reach', (req, res) => buyerNeedController.incrementReach(req, res));
router.get('/:id/reach-status', (req, res) => buyerNeedController.getReachStatus(req, res));

// Buyer Need Response routes
router.post('/:buyer_need_id/responses', (req, res) => buyerNeedResponseController.createResponse(req, res));
router.get('/:buyer_need_id/responses', (req, res) => buyerNeedResponseController.getResponsesByBuyerNeed(req, res));
router.get('/responses/:id', (req, res) => buyerNeedResponseController.getResponseById(req, res));
router.put('/responses/:id', (req, res) => buyerNeedResponseController.updateResponse(req, res));

// Response actions
router.put('/responses/:id/accept', (req, res) => buyerNeedResponseController.acceptResponse(req, res));
router.put('/responses/:id/reject', (req, res) => buyerNeedResponseController.rejectResponse(req, res));
router.put('/responses/:id/withdraw', (req, res) => buyerNeedResponseController.withdrawResponse(req, res));
router.put('/responses/:id/read', (req, res) => buyerNeedResponseController.markResponseAsRead(req, res));
router.put('/responses/:id/feedback', (req, res) => buyerNeedResponseController.provideFeedback(req, res));

module.exports = router;
