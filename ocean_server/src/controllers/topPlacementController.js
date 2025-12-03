const TopPlacementService = require('../services/topPlacementService');

/**
 * Top Placement Controller
 * 
 * Handles API endpoints for top placement management
 */
class TopPlacementController {

  /**
   * Create/purchase a top placement
   * POST /api/top-placement
   */
  static async createTopPlacement(req, res) {
    try {
      const userId = req.user.id;
      const { itemType, itemId, category, placementType = 'category', durationDays = 7 } = req.body;

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
      if (![3, 7, 14].includes(durationDays)) {
        return res.status(400).json({
          success: false,
          message: 'Duration must be 3, 7, or 14 days'
        });
      }

      // Validate placement type
      const validPlacementTypes = ['category', 'search', 'homepage'];
      if (!validPlacementTypes.includes(placementType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid placement type. Must be one of: ${validPlacementTypes.join(', ')}`
        });
      }

      const placement = await TopPlacementService.createTopPlacement(userId, itemType, itemId, {
        category,
        placementType,
        durationDays
      });

      res.status(201).json({
        success: true,
        message: 'Top placement created successfully',
        data: {
          id: placement.id,
          itemType: placement.item_type,
          itemId: placement.item_id,
          category: placement.category,
          placementType: placement.placement_type,
          durationDays: placement.duration_days,
          startDate: placement.start_date,
          endDate: placement.end_date,
          status: placement.status,
          priority: placement.priority
        }
      });
    } catch (error) {
      console.error('Error creating top placement:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating top placement',
        error: error.message
      });
    }
  }

  /**
   * Get user's top placements
   * GET /api/top-placement
   */
  static async getUserTopPlacements(req, res) {
    try {
      const userId = req.user.id;
      const { status, itemType } = req.query;

      const placements = await TopPlacementService.getUserTopPlacements(userId, {
        status,
        itemType
      });

      res.json({
        success: true,
        message: 'Top placements retrieved successfully',
        data: {
          placements: placements.map(placement => ({
            id: placement.id,
            itemType: placement.item_type,
            itemId: placement.item_id,
            category: placement.category,
            placementType: placement.placement_type,
            durationDays: placement.duration_days,
            startDate: placement.start_date,
            endDate: placement.end_date,
            status: placement.status,
            priority: placement.priority,
            createdAt: placement.created_at
          }))
        }
      });
    } catch (error) {
      console.error('Error getting user top placements:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving top placements',
        error: error.message
      });
    }
  }

  /**
   * Get top placements by item type
   * GET /api/top-placement/:itemType
   */
  static async getTopPlacementsByType(req, res) {
    try {
      const { itemType } = req.params;
      const { category, placementType, limit = 20 } = req.query;

      // Validate item type
      const validTypes = ['product', 'auction', 'swap_deal', 'group_buy', 'distress_sale'];
      if (!validTypes.includes(itemType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid item type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      const placements = await TopPlacementService.getTopPlacementsByType(itemType, {
        category,
        placementType,
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        message: 'Top placements retrieved successfully',
        data: {
          itemType: itemType,
          placements: placements.map(placement => ({
            id: placement.id,
            itemId: placement.item_id,
            category: placement.category,
            placementType: placement.placement_type,
            durationDays: placement.duration_days,
            startDate: placement.start_date,
            endDate: placement.end_date,
            priority: placement.priority
          }))
        }
      });
    } catch (error) {
      console.error('Error getting top placements by type:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving top placements',
        error: error.message
      });
    }
  }

  /**
   * Get top placements for a category
   * GET /api/top-placement/:itemType/:category
   */
  static async getTopPlacementsForCategory(req, res) {
    try {
      const { itemType, category } = req.params;
      const { placementType, limit = 20 } = req.query;

      // Validate item type
      const validTypes = ['product', 'auction', 'swap_deal', 'group_buy', 'distress_sale'];
      if (!validTypes.includes(itemType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid item type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      const placements = await TopPlacementService.getTopPlacementsForCategory(itemType, category, {
        placementType,
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        message: 'Top placements retrieved successfully',
        data: {
          itemType: itemType,
          category: category,
          placements: placements.map(placement => ({
            id: placement.id,
            itemId: placement.item_id,
            placementType: placement.placement_type,
            durationDays: placement.duration_days,
            startDate: placement.start_date,
            endDate: placement.end_date,
            priority: placement.priority
          }))
        }
      });
    } catch (error) {
      console.error('Error getting top placements for category:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving top placements',
        error: error.message
      });
    }
  }

  /**
   * Cancel a top placement
   * DELETE /api/top-placement/:id
   */
  static async cancelTopPlacement(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await TopPlacementService.cancelTopPlacement(id, userId);

      res.json({
        success: true,
        message: 'Top placement cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling top placement:', error);
      res.status(500).json({
        success: false,
        message: 'Error cancelling top placement',
        error: error.message
      });
    }
  }

  /**
   * Get top placement analytics
   * GET /api/top-placement/analytics
   */
  static async getTopPlacementAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;

      const analytics = await TopPlacementService.getTopPlacementAnalytics(userId, parseInt(days));

      if (!analytics) {
        return res.status(500).json({
          success: false,
          message: 'Error retrieving top placement analytics'
        });
      }

      res.json({
        success: true,
        message: 'Top placement analytics retrieved successfully',
        data: analytics
      });
    } catch (error) {
      console.error('Error getting top placement analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving top placement analytics',
        error: error.message
      });
    }
  }
}

module.exports = TopPlacementController;

