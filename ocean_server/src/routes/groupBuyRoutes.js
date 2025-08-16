const express = require('express');
const router = express.Router();
const groupBuyController = require('../controllers/groupBuyController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Group Buy CRUD operations
router.post('/create', groupBuyController.createGroupBuy);
router.get('/all', groupBuyController.getAllGroupBuys);
router.get('/:id', groupBuyController.getGroupBuyById);
router.put('/:id', groupBuyController.updateGroupBuy);
router.delete('/:id', groupBuyController.deleteGroupBuy);

// Group Buy participation
router.post('/:id/join', groupBuyController.joinGroupBuy);
router.delete('/:id/leave', groupBuyController.leaveGroupBuy);

// User-specific group buys
router.get('/user/me', groupBuyController.getUserGroupBuys);

// Admin/creator operations
router.put('/:id/successful', groupBuyController.markGroupBuySuccessful);

// Statistics
router.get('/stats/overview', groupBuyController.getGroupBuyStats);

module.exports = router;
