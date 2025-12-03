const express = require('express');
const router = express.Router();
const TopPlacementController = require('../controllers/topPlacementController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Top Placement Routes
 * 
 * API endpoints for top placement management
 * All routes require authentication
 */

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/top-placement
 * Create/purchase a top placement
 */
router.post('/', TopPlacementController.createTopPlacement);

/**
 * GET /api/top-placement
 * Get user's top placements
 */
router.get('/', TopPlacementController.getUserTopPlacements);

/**
 * GET /api/top-placement/analytics
 * Get top placement analytics
 */
router.get('/analytics', TopPlacementController.getTopPlacementAnalytics);

/**
 * GET /api/top-placement/:itemType
 * Get top placements by item type
 */
router.get('/:itemType', TopPlacementController.getTopPlacementsByType);

/**
 * GET /api/top-placement/:itemType/:category
 * Get top placements for a category
 */
router.get('/:itemType/:category', TopPlacementController.getTopPlacementsForCategory);

/**
 * DELETE /api/top-placement/:id
 * Cancel a top placement
 */
router.delete('/:id', TopPlacementController.cancelTopPlacement);

module.exports = router;

