const PromotionAnalyticsService = require('../services/promotionAnalyticsService');

/**
 * Promotion Analytics Controller
 * 
 * Handles API endpoints for promotion analytics and reporting
 */
class PromotionAnalyticsController {

  /**
   * Get overall analytics across all promotion types
   * GET /api/promotions/analytics
   */
  static async getOverallAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;

      const analytics = await PromotionAnalyticsService.getOverallAnalytics(
        userId,
        parseInt(days)
      );

      if (!analytics) {
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve analytics'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Overall analytics retrieved successfully',
        data: analytics
      });
    } catch (error) {
      console.error('Get overall analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving overall analytics',
        error: error.message
      });
    }
  }

  /**
   * Get boost analytics
   * GET /api/promotions/analytics/boost
   */
  static async getBoostAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;

      const analytics = await PromotionAnalyticsService.getBoostAnalytics(
        userId,
        parseInt(days)
      );

      if (!analytics) {
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve boost analytics'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Boost analytics retrieved successfully',
        data: analytics
      });
    } catch (error) {
      console.error('Get boost analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving boost analytics',
        error: error.message
      });
    }
  }

  /**
   * Get top placement analytics
   * GET /api/promotions/analytics/top-placement
   */
  static async getTopPlacementAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;

      const analytics = await PromotionAnalyticsService.getTopPlacementAnalytics(
        userId,
        parseInt(days)
      );

      if (!analytics) {
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve top placement analytics'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Top placement analytics retrieved successfully',
        data: analytics
      });
    } catch (error) {
      console.error('Get top placement analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving top placement analytics',
        error: error.message
      });
    }
  }

  /**
   * Get spotlight analytics
   * GET /api/promotions/analytics/spotlight
   */
  static async getSpotlightAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;

      const analytics = await PromotionAnalyticsService.getSpotlightAnalytics(
        userId,
        parseInt(days)
      );

      if (!analytics) {
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve spotlight analytics'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Spotlight analytics retrieved successfully',
        data: analytics
      });
    } catch (error) {
      console.error('Get spotlight analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving spotlight analytics',
        error: error.message
      });
    }
  }

  /**
   * Get performance comparison across promotion types
   * GET /api/promotions/analytics/performance
   */
  static async getPerformanceComparison(req, res) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;

      const comparison = await PromotionAnalyticsService.getPerformanceComparison(
        userId,
        parseInt(days)
      );

      if (!comparison) {
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve performance comparison'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Performance comparison retrieved successfully',
        data: comparison
      });
    } catch (error) {
      console.error('Get performance comparison error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving performance comparison',
        error: error.message
      });
    }
  }

  /**
   * Get period comparison (current vs previous period)
   * GET /api/promotions/analytics/period-comparison
   */
  static async getPeriodComparison(req, res) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;

      const comparison = await PromotionAnalyticsService.getPeriodComparison(
        userId,
        parseInt(days)
      );

      if (!comparison) {
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve period comparison'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Period comparison retrieved successfully',
        data: comparison
      });
    } catch (error) {
      console.error('Get period comparison error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving period comparison',
        error: error.message
      });
    }
  }

  /**
   * Get item type comparison
   * GET /api/promotions/analytics/item-type-comparison
   */
  static async getItemTypeComparison(req, res) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;

      const comparison = await PromotionAnalyticsService.getItemTypeComparison(
        userId,
        parseInt(days)
      );

      if (!comparison) {
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve item type comparison'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Item type comparison retrieved successfully',
        data: comparison
      });
    } catch (error) {
      console.error('Get item type comparison error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving item type comparison',
        error: error.message
      });
    }
  }

  /**
   * Get recent promotions with metrics
   * GET /api/promotions/analytics/recent
   */
  static async getRecentPromotions(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10 } = req.query;

      const promotions = await PromotionAnalyticsService.getRecentPromotions(
        userId,
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        message: 'Recent promotions retrieved successfully',
        data: {
          promotions,
          count: promotions.length
        }
      });
    } catch (error) {
      console.error('Get recent promotions error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving recent promotions',
        error: error.message
      });
    }
  }

  /**
   * Get time-series data for charts
   * GET /api/promotions/analytics/time-series
   */
  static async getTimeSeriesData(req, res) {
    try {
      const userId = req.user.id;
      const { promotionType = 'all', days = 30 } = req.query;

      const timeSeries = await PromotionAnalyticsService.getTimeSeriesData(
        userId,
        promotionType,
        parseInt(days)
      );

      if (!timeSeries) {
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve time-series data'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Time-series data retrieved successfully',
        data: timeSeries
      });
    } catch (error) {
      console.error('Get time-series data error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving time-series data',
        error: error.message
      });
    }
  }
}

module.exports = PromotionAnalyticsController;

