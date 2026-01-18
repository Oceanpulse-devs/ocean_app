const express = require('express');
const router = express.Router();
const marketAnalyticsController = require('../controllers/marketAnalyticsController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Market Analytics Core Routes
router.post('/track', (req, res) => marketAnalyticsController.trackMetric(req, res));
router.get('/overview', (req, res) => marketAnalyticsController.getMarketOverview(req, res));
router.get('/category/:category_id', (req, res) => marketAnalyticsController.getCategoryAnalytics(req, res));
router.get('/search', (req, res) => marketAnalyticsController.getSearchAnalytics(req, res));
router.get('/user-behavior', (req, res) => marketAnalyticsController.getUserBehaviorAnalytics(req, res));
router.get('/trends', (req, res) => marketAnalyticsController.getMarketTrends(req, res));

// Additional Analytics Endpoints
router.get('/category/:category_id/performance', (req, res) => marketAnalyticsController.getCategoryAnalytics(req, res));
router.get('/search/queries', (req, res) => marketAnalyticsController.getSearchAnalytics(req, res));
router.get('/user-behavior/patterns', (req, res) => marketAnalyticsController.getUserBehaviorAnalytics(req, res));
router.get('/trends/forecast', (req, res) => marketAnalyticsController.getMarketTrends(req, res));

module.exports = router;
