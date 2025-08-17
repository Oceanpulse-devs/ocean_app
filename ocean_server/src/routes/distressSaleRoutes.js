const express = require('express');
const router = express.Router();
const distressSaleController = require('../controllers/distressSaleController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.get('/all', distressSaleController.getAllDistressSales);
router.get('/stats', distressSaleController.getDistressSaleStats);
router.get('/:id', distressSaleController.getDistressSaleById);

// Protected routes (authentication required)
router.post('/create', authMiddleware, distressSaleController.createDistressSale);
router.put('/:id', authMiddleware, distressSaleController.updateDistressSale);
router.delete('/:id', authMiddleware, distressSaleController.deleteDistressSale);
router.put('/:id/convert', authMiddleware, distressSaleController.convertToDistressSale);

module.exports = router;
