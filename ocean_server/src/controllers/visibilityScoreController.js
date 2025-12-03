const VisibilityScoreService = require('../services/visibilityScoreService');

/**
 * Visibility Score Controller
 * 
 * Handles API endpoints for visibility score management
 */
class VisibilityScoreController {

  /**
   * Get visibility score for an item
   * GET /api/visibility-scores/:itemType/:itemId
   */
  static async getVisibilityScore(req, res) {
    try {
      const { itemType, itemId } = req.params;

      // Validate item type
      const validTypes = ['product', 'auction', 'swap_deal', 'group_buy', 'distress_sale'];
      if (!validTypes.includes(itemType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid item type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      const scoreRecord = await VisibilityScoreService.getVisibilityScore(itemType, itemId);

      if (!scoreRecord) {
        return res.status(404).json({
          success: false,
          message: 'Visibility score not found. Score may need to be calculated.'
        });
      }

      res.json({
        success: true,
        message: 'Visibility score retrieved successfully',
        data: {
          itemType: scoreRecord.item_type,
          itemId: scoreRecord.item_id,
          score: parseFloat(scoreRecord.visibility_score),
          breakdown: scoreRecord.score_breakdown || {},
          calculatedAt: scoreRecord.calculated_at
        }
      });
    } catch (error) {
      console.error('Error getting visibility score:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving visibility score',
        error: error.message
      });
    }
  }

  /**
   * Get score breakdown for an item
   * GET /api/visibility-scores/:itemType/:itemId/breakdown
   */
  static async getScoreBreakdown(req, res) {
    try {
      const { itemType, itemId } = req.params;
      const { buyerLocation, buyerCategory } = req.query;

      // Validate item type
      const validTypes = ['product', 'auction', 'swap_deal', 'group_buy', 'distress_sale'];
      if (!validTypes.includes(itemType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid item type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      const breakdown = await VisibilityScoreService.getScoreBreakdown(itemType, itemId, {
        buyerLocation,
        buyerCategory
      });

      if (!breakdown) {
        return res.status(404).json({
          success: false,
          message: 'Score breakdown not found'
        });
      }

      res.json({
        success: true,
        message: 'Score breakdown retrieved successfully',
        data: breakdown
      });
    } catch (error) {
      console.error('Error getting score breakdown:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving score breakdown',
        error: error.message
      });
    }
  }

  /**
   * Manually calculate/recalculate visibility score (admin only)
   * POST /api/visibility-scores/calculate
   */
  static async calculateScore(req, res) {
    try {
      const { itemType, itemId, buyerLocation, buyerCategory } = req.body;

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

      const result = await VisibilityScoreService.calculateAndSaveScore(itemType, itemId, {
        buyerLocation,
        buyerCategory
      });

      res.json({
        success: true,
        message: 'Visibility score calculated and saved successfully',
        data: {
          itemType: itemType,
          itemId: itemId,
          score: result.scoreResult.score,
          baseScore: result.scoreResult.baseScore,
          multiplier: result.scoreResult.multiplier,
          breakdown: result.scoreResult.breakdown,
          calculatedAt: result.scoreResult.calculatedAt,
          created: result.created
        }
      });
    } catch (error) {
      console.error('Error calculating visibility score:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculating visibility score',
        error: error.message
      });
    }
  }
}

module.exports = VisibilityScoreController;

