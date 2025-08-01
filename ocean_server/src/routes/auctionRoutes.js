const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const auctionController = require('../controllers/auctionController');

// Public routes (no authentication required)
router.get('/api/auctions', auctionController.getAuctions);
router.get('/api/auctions/categories', auctionController.getAuctionCategories);
router.get('/api/auction/:auctionId', auctionController.getAuction);

// Protected routes (authentication required)
router.post('/api/auctions', authMiddleware, auctionController.createAuction);
router.post('/api/auction/:auctionId/bid', authMiddleware, auctionController.placeBid);
router.post('/api/auction/:auctionId/watch', authMiddleware, auctionController.toggleWatchAuction);
router.put('/api/auction/:auctionId', authMiddleware, auctionController.updateAuction);
router.delete('/api/auction/:auctionId', authMiddleware, auctionController.cancelAuction);

// User-specific routes
router.get('/api/user/auctions', authMiddleware, auctionController.getUserAuctions);
router.get('/api/user/bids', authMiddleware, auctionController.getUserBids);

module.exports = router; 