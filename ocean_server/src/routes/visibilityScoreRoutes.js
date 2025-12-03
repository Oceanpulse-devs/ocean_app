const express = require('express');
const router = express.Router();
const VisibilityScoreController = require('../controllers/visibilityScoreController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Visibility Score Routes
 * 
 * API endpoints for visibility score management
 */

/**
 * GET /api/visibility-scores/:itemType/:itemId
 * Get visibility score for an item
 * Public endpoint - no authentication required
 */
router.get('/:itemType/:itemId', VisibilityScoreController.getVisibilityScore);

/**
 * GET /api/visibility-scores/:itemType/:itemId/breakdown
 * Get score breakdown for an item
 * Public endpoint - no authentication required
 */
router.get('/:itemType/:itemId/breakdown', VisibilityScoreController.getScoreBreakdown);

/**
 * POST /api/visibility-scores/calculate
 * Manually calculate/recalculate visibility score
 * Requires authentication (admin only in production)
 */
router.post('/calculate', authMiddleware, VisibilityScoreController.calculateScore);

module.exports = router;

