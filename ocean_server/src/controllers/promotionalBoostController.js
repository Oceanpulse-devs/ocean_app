const subscriptionService = require('../services/subscriptionService');
const { PromotionalBoost } = require('../../models');
const { Op } = require('sequelize');

/**
 * Promotional Boost Controller
 * 
 * Handles promotional boost management including:
 * - Creating and managing boosts
 * - Boost analytics and reporting
 * - Boost expiration handling
 */

class PromotionalBoostController {

  /**
   * Create a promotional boost
   * POST /api/boosts
   */
  static async createBoost(req, res) {
    try {
      const userId = req.user.id;
      const { boostType, targetId, durationHours = 24, reason = '' } = req.body;

      if (!boostType || !targetId) {
        return res.status(400).json({
          success: false,
          message: 'Boost type and target ID are required'
        });
      }

      // Validate boost type
      const validBoostTypes = ['product', 'group_buy', 'swap_deal', 'auction', 'buyer_need'];
      if (!validBoostTypes.includes(boostType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid boost type. Must be one of: ' + validBoostTypes.join(', ')
        });
      }

      // Validate duration
      if (durationHours < 1 || durationHours > 168) { // Max 1 week
        return res.status(400).json({
          success: false,
          message: 'Duration must be between 1 and 168 hours (1 week)'
        });
      }

      const boost = await subscriptionService.createPromotionalBoost(
        userId, 
        boostType, 
        targetId, 
        durationHours, 
        reason
      );

      res.status(201).json({
        success: true,
        message: 'Promotional boost created successfully',
        data: {
          id: boost.id,
          boostType: boost.boost_type,
          targetId: boost.target_id,
          durationHours: boost.boost_duration_hours,
          startTime: boost.start_time,
          endTime: boost.end_time,
          status: boost.status,
          reason: boost.boost_reason
        }
      });
    } catch (error) {
      console.error('Error creating promotional boost:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating promotional boost',
        error: error.message
      });
    }
  }

  /**
   * Get user's promotional boosts
   * GET /api/boosts
   */
  static async getUserBoosts(req, res) {
    try {
      const userId = req.user.id;
      const { status, boostType, page = 1, limit = 10 } = req.query;

      // Build where clause
      const whereClause = { user_id: userId };
      if (status) whereClause.status = status;
      if (boostType) whereClause.boost_type = boostType;

      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: boosts } = await PromotionalBoost.findAndCountAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        success: true,
        message: 'Promotional boosts retrieved successfully',
        data: {
          boosts: boosts.map(boost => ({
            id: boost.id,
            boostType: boost.boost_type,
            targetId: boost.target_id,
            durationHours: boost.boost_duration_hours,
            startTime: boost.start_time,
            endTime: boost.end_time,
            status: boost.status,
            reason: boost.boost_reason,
            createdAt: boost.created_at
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting promotional boosts:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving promotional boosts',
        error: error.message
      });
    }
  }

  /**
   * Get boost details
   * GET /api/boosts/:id
   */
  static async getBoostDetails(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const boost = await PromotionalBoost.findOne({
        where: {
          id: id,
          user_id: userId
        }
      });

      if (!boost) {
        return res.status(404).json({
          success: false,
          message: 'Promotional boost not found'
        });
      }

      res.json({
        success: true,
        message: 'Boost details retrieved successfully',
        data: {
          id: boost.id,
          boostType: boost.boost_type,
          targetId: boost.target_id,
          durationHours: boost.boost_duration_hours,
          startTime: boost.start_time,
          endTime: boost.end_time,
          status: boost.status,
          reason: boost.boost_reason,
          createdAt: boost.created_at
        }
      });
    } catch (error) {
      console.error('Error getting boost details:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving boost details',
        error: error.message
      });
    }
  }

  /**
   * Cancel a promotional boost
   * DELETE /api/boosts/:id
   */
  static async cancelBoost(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const boost = await PromotionalBoost.findOne({
        where: {
          id: id,
          user_id: userId,
          status: 'active'
        }
      });

      if (!boost) {
        return res.status(404).json({
          success: false,
          message: 'Active promotional boost not found'
        });
      }

      await boost.update({
        status: 'cancelled'
      });

      res.json({
        success: true,
        message: 'Promotional boost cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling boost:', error);
      res.status(500).json({
        success: false,
        message: 'Error cancelling promotional boost',
        error: error.message
      });
    }
  }

  /**
   * Get boost analytics
   * GET /api/boosts/analytics
   */
  static async getBoostAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      // Get boost statistics
      const totalBoosts = await PromotionalBoost.count({
        where: {
          user_id: userId,
          created_at: { [Op.gte]: startDate }
        }
      });

      const activeBoosts = await PromotionalBoost.count({
        where: {
          user_id: userId,
          status: 'active',
          created_at: { [Op.gte]: startDate }
        }
      });

      const expiredBoosts = await PromotionalBoost.count({
        where: {
          user_id: userId,
          status: 'expired',
          created_at: { [Op.gte]: startDate }
        }
      });

      const cancelledBoosts = await PromotionalBoost.count({
        where: {
          user_id: userId,
          status: 'cancelled',
          created_at: { [Op.gte]: startDate }
        }
      });

      // Get boosts by type
      const boostsByType = await PromotionalBoost.findAll({
        where: {
          user_id: userId,
          created_at: { [Op.gte]: startDate }
        },
        attributes: [
          'boost_type',
          [PromotionalBoost.sequelize.fn('COUNT', PromotionalBoost.sequelize.col('id')), 'count']
        ],
        group: ['boost_type']
      });

      res.json({
        success: true,
        message: 'Boost analytics retrieved successfully',
        data: {
          period: {
            days: parseInt(days),
            startDate: startDate,
            endDate: new Date()
          },
          summary: {
            totalBoosts: totalBoosts,
            activeBoosts: activeBoosts,
            expiredBoosts: expiredBoosts,
            cancelledBoosts: cancelledBoosts
          },
          byType: boostsByType.map(item => ({
            boostType: item.boost_type,
            count: parseInt(item.dataValues.count)
          }))
        }
      });
    } catch (error) {
      console.error('Error getting boost analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving boost analytics',
        error: error.message
      });
    }
  }

  /**
   * Update expired boosts (cron job endpoint)
   * POST /api/boosts/update-expired
   */
  static async updateExpiredBoosts(req, res) {
    try {
      const now = new Date();
      
      const expiredBoosts = await PromotionalBoost.findAll({
        where: {
          status: 'active',
          end_time: { [Op.lt]: now }
        }
      });

      let updatedCount = 0;
      for (const boost of expiredBoosts) {
        await boost.update({ status: 'expired' });
        updatedCount++;
      }

      res.json({
        success: true,
        message: `Updated ${updatedCount} expired boosts`,
        data: {
          updatedCount: updatedCount,
          timestamp: now
        }
      });
    } catch (error) {
      console.error('Error updating expired boosts:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating expired boosts',
        error: error.message
      });
    }
  }
}

module.exports = PromotionalBoostController;

