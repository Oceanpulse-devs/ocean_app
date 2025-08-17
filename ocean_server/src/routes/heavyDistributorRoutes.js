const express = require('express');
const router = express.Router();
const heavyDistributorController = require('../controllers/heavyDistributorController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.get('/all', heavyDistributorController.getAllDistributors);
router.get('/search', heavyDistributorController.searchDistributors);
router.get('/:id', heavyDistributorController.getDistributorById);
router.get('/:id/stats', heavyDistributorController.getDistributorStats);

// Protected routes (authentication required)
router.post('/create', authMiddleware, heavyDistributorController.createDistributor);
router.put('/:id', authMiddleware, heavyDistributorController.updateDistributor);
router.delete('/:id', authMiddleware, heavyDistributorController.deleteDistributor);

// Inquiry routes
router.post('/inquiry', authMiddleware, heavyDistributorController.createInquiry);
router.get('/:distributorId/inquiries', authMiddleware, heavyDistributorController.getDistributorInquiries);

module.exports = router;
