const express = require('express');
const router = express.Router();
const marketAnalyticsController = require('../controllers/marketAnalyticsController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Market Analytics Core Routes
router.post('/track', marketAnalyticsController.trackMetric);
router.get('/overview', marketAnalyticsController.getMarketOverview);
router.get('/category/:category_id', marketAnalyticsController.getCategoryAnalytics);
router.get('/search', marketAnalyticsController.getSearchAnalytics);
router.get('/user-behavior', marketAnalyticsController.getUserBehaviorAnalytics);
router.get('/trends', marketAnalyticsController.getMarketTrends);

// Additional Analytics Endpoints
router.get('/category/:category_id/performance', marketAnalyticsController.getCategoryAnalytics);
router.get('/search/queries', marketAnalyticsController.getSearchAnalytics);
router.get('/user-behavior/patterns', marketAnalyticsController.getUserBehaviorAnalytics);
router.get('/trends/forecast', marketAnalyticsController.getMarketTrends);

module.exports = router;
