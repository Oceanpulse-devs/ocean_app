const express = require('express');
const router = express.Router();
const heavyDistributorController = require('../controllers/heavyDistributorController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.get('/all', (req, res) => heavyDistributorController.getAllDistributors(req, res));
router.get('/search', (req, res) => heavyDistributorController.searchDistributors(req, res));
router.get('/:id', (req, res) => heavyDistributorController.getDistributorById(req, res));
router.get('/:id/stats', (req, res) => heavyDistributorController.getDistributorStats(req, res));

// Protected routes (authentication required)
router.post('/create', authMiddleware, (req, res) => heavyDistributorController.createDistributor(req, res));
router.put('/:id', authMiddleware, (req, res) => heavyDistributorController.updateDistributor(req, res));
router.delete('/:id', authMiddleware, (req, res) => heavyDistributorController.deleteDistributor(req, res));

// Inquiry routes
router.post('/inquiry', authMiddleware, (req, res) => heavyDistributorController.createInquiry(req, res));
router.get('/:distributorId/inquiries', authMiddleware, (req, res) => heavyDistributorController.getDistributorInquiries(req, res));

module.exports = router;
