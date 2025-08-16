const express = require('express');
const router = express.Router();
const swapDealController = require('../controllers/swapDealController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Swap Deal CRUD operations
router.post('/create', swapDealController.createSwapDeal);
router.get('/all', swapDealController.getAllSwapDeals);
router.get('/:id', swapDealController.getSwapDealById);
router.put('/:id', swapDealController.updateSwapDeal);

// Swap Deal actions
router.put('/:id/accept', swapDealController.acceptSwapDeal);
router.put('/:id/reject', swapDealController.rejectSwapDeal);
router.put('/:id/cancel', swapDealController.cancelSwapDeal);
router.put('/:id/complete', swapDealController.completeSwapDeal);

// User-specific swap deals
router.get('/user/me', swapDealController.getUserSwapDeals);

// Statistics
router.get('/stats/overview', swapDealController.getSwapDealStats);

module.exports = router;
