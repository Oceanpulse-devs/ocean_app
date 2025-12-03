const express = require('express');
const router = express.Router();
const PromotionAnalyticsController = require('../controllers/promotionAnalyticsController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Promotion Analytics Routes
 * 
 * API endpoints for promotion analytics and reporting
 * All routes require authentication
 */

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/promotions/analytics
 * Get overall analytics across all promotion types
 */
router.get('/', PromotionAnalyticsController.getOverallAnalytics);

/**
 * GET /api/promotions/analytics/boost
 * Get boost-specific analytics
 */
router.get('/boost', PromotionAnalyticsController.getBoostAnalytics);

/**
 * GET /api/promotions/analytics/top-placement
 * Get top placement analytics
 */
router.get('/top-placement', PromotionAnalyticsController.getTopPlacementAnalytics);

/**
 * GET /api/promotions/analytics/spotlight
 * Get spotlight analytics
 */
router.get('/spotlight', PromotionAnalyticsController.getSpotlightAnalytics);

/**
 * GET /api/promotions/analytics/performance
 * Get performance comparison across promotion types
 */
router.get('/performance', PromotionAnalyticsController.getPerformanceComparison);

/**
 * GET /api/promotions/analytics/period-comparison
 * Get period comparison (current vs previous period)
 */
router.get('/period-comparison', PromotionAnalyticsController.getPeriodComparison);

/**
 * GET /api/promotions/analytics/item-type-comparison
 * Get item type comparison
 */
router.get('/item-type-comparison', PromotionAnalyticsController.getItemTypeComparison);

/**
 * GET /api/promotions/analytics/recent
 * Get recent promotions with metrics
 */
router.get('/recent', PromotionAnalyticsController.getRecentPromotions);

/**
 * GET /api/promotions/analytics/time-series
 * Get time-series data for charts
 */
router.get('/time-series', PromotionAnalyticsController.getTimeSeriesData);

module.exports = router;

