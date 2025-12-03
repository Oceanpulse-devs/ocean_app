const express = require('express');
const router = express.Router();
const SpotlightController = require('../controllers/spotlightController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Spotlight Routes
 * 
 * API endpoints for spotlight management
 * Most routes require authentication, except impression/click tracking
 */

/**
 * POST /api/spotlight/:id/impression
 * Track impression (public - no auth required)
 */
router.post('/:id/impression', SpotlightController.trackImpression);

/**
 * POST /api/spotlight/:id/click
 * Track click (public - no auth required)
 */
router.post('/:id/click', SpotlightController.trackClick);

/**
 * GET /api/spotlight/:slotType
 * Get spotlight items by slot type (public - no auth required)
 */
router.get('/:slotType', SpotlightController.getSpotlightsBySlotType);

/**
 * GET /api/spotlight/:slotType/:category
 * Get spotlight items for category (public - no auth required)
 */
router.get('/:slotType/:category', SpotlightController.getSpotlightsForCategory);

// Apply authentication middleware to remaining routes
router.use(authMiddleware);

/**
 * POST /api/spotlight
 * Create/request a spotlight slot
 */
router.post('/', SpotlightController.createSpotlight);

/**
 * GET /api/spotlight
 * Get user's spotlight slots
 */
router.get('/', SpotlightController.getUserSpotlights);

/**
 * GET /api/spotlight/analytics
 * Get spotlight analytics
 */
router.get('/analytics', SpotlightController.getSpotlightAnalytics);

/**
 * DELETE /api/spotlight/:id
 * Cancel a spotlight
 */
router.delete('/:id', SpotlightController.cancelSpotlight);

module.exports = router;

