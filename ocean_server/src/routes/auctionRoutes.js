const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const auctionController = require('../controllers/auctionController');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for auction images'), false);
    }
  }
});

// Public routes (no authentication required)
router.get('/api/auctions', auctionController.getAuctions);
router.get('/api/auctions/categories', auctionController.getAuctionCategories);
router.get('/api/auction/:auctionId', auctionController.getAuction);

// Protected routes (authentication required)
router.post('/api/auctions', authMiddleware, upload.array('images', 10), auctionController.createAuction);
router.post('/api/auction/:auctionId/bid', authMiddleware, auctionController.placeBid);
router.post('/api/auction/:auctionId/watch', authMiddleware, auctionController.toggleWatchAuction);
router.put('/api/auction/:auctionId', authMiddleware, upload.array('images', 10), auctionController.updateAuction);
router.delete('/api/auction/:auctionId', authMiddleware, auctionController.cancelAuction);

// User-specific routes
router.get('/api/user/auctions', authMiddleware, auctionController.getUserAuctions);
router.get('/api/user/bids', authMiddleware, auctionController.getUserBids);

module.exports = router; 