const SpotlightService = require('../services/spotlightService');

/**
 * Spotlight Controller
 * 
 * Handles API endpoints for spotlight management
 */
class SpotlightController {

  /**
   * Create/request a spotlight slot
   * POST /api/spotlight
   */
  static async createSpotlight(req, res) {
    try {
      const userId = req.user.id;
      const { itemType, itemId, slotType = 'homepage', category, durationDays = 7 } = req.body;

      if (!itemType || !itemId) {
        return res.status(400).json({
          success: false,
          message: 'itemType and itemId are required'
        });
      }

      // Validate item type
      const validTypes = ['product', 'auction', 'swap_deal', 'group_buy', 'distress_sale'];
      if (!validTypes.includes(itemType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid item type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      // Validate duration
      if (![7, 14].includes(durationDays)) {
        return res.status(400).json({
          success: false,
          message: 'Duration must be 7 or 14 days'
        });
      }

      // Validate slot type
      const validSlotTypes = ['homepage', 'category', 'search', 'sponsored'];
      if (!validSlotTypes.includes(slotType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid slot type. Must be one of: ${validSlotTypes.join(', ')}`
        });
      }

      // Validate category if slot type is category
      if (slotType === 'category' && !category) {
        return res.status(400).json({
          success: false,
          message: 'Category is required for category spotlight'
        });
      }

      const spotlight = await SpotlightService.createSpotlightSlot(userId, itemType, itemId, {
        slotType,
        category,
        durationDays
      });

      res.status(201).json({
        success: true,
        message: 'Spotlight slot created successfully',
        data: {
          id: spotlight.id,
          itemType: spotlight.item_type,
          itemId: spotlight.item_id,
          slotType: spotlight.slot_type,
          category: spotlight.category,
          durationDays: spotlight.duration_days,
          startDate: spotlight.start_date,
          endDate: spotlight.end_date,
          status: spotlight.status,
          displayOrder: spotlight.display_order
        }
      });
    } catch (error) {
      console.error('Error creating spotlight:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating spotlight',
        error: error.message
      });
    }
  }

  /**
   * Get user's spotlight slots
   * GET /api/spotlight
   */
  static async getUserSpotlights(req, res) {
    try {
      const userId = req.user.id;
      const { status, slotType, itemType } = req.query;

      const spotlights = await SpotlightService.getUserSpotlights(userId, {
        status,
        slotType,
        itemType
      });

      res.json({
        success: true,
        message: 'Spotlight slots retrieved successfully',
        data: {
          spotlights: spotlights.map(spotlight => ({
            id: spotlight.id,
            itemType: spotlight.item_type,
            itemId: spotlight.item_id,
            slotType: spotlight.slot_type,
            category: spotlight.category,
            durationDays: spotlight.duration_days,
            startDate: spotlight.start_date,
            endDate: spotlight.end_date,
            status: spotlight.status,
            displayOrder: spotlight.display_order,
            impressions: spotlight.impressions,
            clicks: spotlight.clicks,
            createdAt: spotlight.created_at
          }))
        }
      });
    } catch (error) {
      console.error('Error getting user spotlights:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving spotlight slots',
        error: error.message
      });
    }
  }

  /**
   * Get spotlight items by slot type
   * GET /api/spotlight/:slotType
   */
  static async getSpotlightsBySlotType(req, res) {
    try {
      const { slotType } = req.params;
      const { category, limit = 20, offset = 0 } = req.query;

      // Validate slot type
      const validSlotTypes = ['homepage', 'category', 'search', 'sponsored'];
      if (!validSlotTypes.includes(slotType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid slot type. Must be one of: ${validSlotTypes.join(', ')}`
        });
      }

      const spotlights = await SpotlightService.getSpotlightsBySlotType(slotType, {
        category,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        message: 'Spotlight items retrieved successfully',
        data: {
          slotType: slotType,
          spotlights: spotlights.map(spotlight => ({
            id: spotlight.id,
            itemType: spotlight.item_type,
            itemId: spotlight.item_id,
            category: spotlight.category,
            durationDays: spotlight.duration_days,
            startDate: spotlight.start_date,
            endDate: spotlight.end_date,
            displayOrder: spotlight.display_order,
            impressions: spotlight.impressions,
            clicks: spotlight.clicks
          }))
        }
      });
    } catch (error) {
      console.error('Error getting spotlights by slot type:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving spotlight items',
        error: error.message
      });
    }
  }

  /**
   * Get spotlight items for a category
   * GET /api/spotlight/:slotType/:category
   */
  static async getSpotlightsForCategory(req, res) {
    try {
      const { slotType, category } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      // Validate slot type
      const validSlotTypes = ['homepage', 'category', 'search', 'sponsored'];
      if (!validSlotTypes.includes(slotType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid slot type. Must be one of: ${validSlotTypes.join(', ')}`
        });
      }

      const spotlights = await SpotlightService.getSpotlightsForCategory(slotType, category, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        message: 'Spotlight items retrieved successfully',
        data: {
          slotType: slotType,
          category: category,
          spotlights: spotlights.map(spotlight => ({
            id: spotlight.id,
            itemType: spotlight.item_type,
            itemId: spotlight.item_id,
            durationDays: spotlight.duration_days,
            startDate: spotlight.start_date,
            endDate: spotlight.end_date,
            displayOrder: spotlight.display_order,
            impressions: spotlight.impressions,
            clicks: spotlight.clicks
          }))
        }
      });
    } catch (error) {
      console.error('Error getting spotlights for category:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving spotlight items',
        error: error.message
      });
    }
  }

  /**
   * Track impression for a spotlight
   * POST /api/spotlight/:id/impression
   * Public endpoint - no authentication required
   */
  static async trackImpression(req, res) {
    try {
      const { id } = req.params;

      const success = await SpotlightService.trackImpression(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Spotlight not found'
        });
      }

      res.json({
        success: true,
        message: 'Impression tracked successfully'
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
      res.status(500).json({
        success: false,
        message: 'Error tracking impression',
        error: error.message
      });
    }
  }

  /**
   * Track click for a spotlight
   * POST /api/spotlight/:id/click
   * Public endpoint - no authentication required
   */
  static async trackClick(req, res) {
    try {
      const { id } = req.params;

      const success = await SpotlightService.trackClick(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Spotlight not found'
        });
      }

      res.json({
        success: true,
        message: 'Click tracked successfully'
      });
    } catch (error) {
      console.error('Error tracking click:', error);
      res.status(500).json({
        success: false,
        message: 'Error tracking click',
        error: error.message
      });
    }
  }

  /**
   * Cancel a spotlight
   * DELETE /api/spotlight/:id
   */
  static async cancelSpotlight(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await SpotlightService.cancelSpotlight(id, userId);

      res.json({
        success: true,
        message: 'Spotlight cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling spotlight:', error);
      res.status(500).json({
        success: false,
        message: 'Error cancelling spotlight',
        error: error.message
      });
    }
  }

  /**
   * Get spotlight analytics
   * GET /api/spotlight/analytics
   */
  static async getSpotlightAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;

      const analytics = await SpotlightService.getSpotlightAnalytics(userId, parseInt(days));

      if (!analytics) {
        return res.status(500).json({
          success: false,
          message: 'Error retrieving spotlight analytics'
        });
      }

      res.json({
        success: true,
        message: 'Spotlight analytics retrieved successfully',
        data: analytics
      });
    } catch (error) {
      console.error('Error getting spotlight analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving spotlight analytics',
        error: error.message
      });
    }
  }
}

module.exports = SpotlightController;

