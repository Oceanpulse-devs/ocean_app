const { PromotionalBoost, Product, GroupBuy, SwapDeal, Auction } = require('../../models');
const { Op } = require('sequelize');

/**
 * Boost Management Service
 * 
 * Handles promotional boost operations across different models
 * including applying boosts, removing expired boosts, and boost analytics
 */

class BoostManagementService {

  /**
   * Apply a boost to a specific item
   * @param {Object} boost - Boost object
   * @returns {boolean} Success status
   */
  static async applyBoost(boost) {
    try {
      const { boost_type, target_id, end_time, id: boostId } = boost;

      // Map boost types to models
      const modelMap = {
        'product': Product,
        'group_buy': GroupBuy,
        'swap_deal': SwapDeal,
        'auction': Auction
      };

      const Model = modelMap[boost_type];
      if (!Model) {
        throw new Error(`Invalid boost type: ${boost_type}`);
      }

      // Update the target item with boost information
      await Model.update({
        is_boosted: true,
        boost_expires_at: end_time,
        boost_id: boostId
      }, {
        where: { id: target_id }
      });

      console.log(`Applied boost ${boostId} to ${boost_type} ${target_id}`);
      return true;
    } catch (error) {
      console.error('Error applying boost:', error);
      return false;
    }
  }

  /**
   * Remove boost from a specific item
   * @param {Object} boost - Boost object
   * @returns {boolean} Success status
   */
  static async removeBoost(boost) {
    try {
      const { boost_type, target_id } = boost;

      // Map boost types to models
      const modelMap = {
        'product': Product,
        'group_buy': GroupBuy,
        'swap_deal': SwapDeal,
        'auction': Auction
      };

      const Model = modelMap[boost_type];
      if (!Model) {
        throw new Error(`Invalid boost type: ${boost_type}`);
      }

      // Remove boost information from the target item
      await Model.update({
        is_boosted: false,
        boost_expires_at: null,
        boost_id: null
      }, {
        where: { id: target_id }
      });

      console.log(`Removed boost from ${boost_type} ${target_id}`);
      return true;
    } catch (error) {
      console.error('Error removing boost:', error);
      return false;
    }
  }

  /**
   * Update expired boosts
   * @returns {number} Number of boosts updated
   */
  static async updateExpiredBoosts() {
    try {
      const now = new Date();
      
      // Find all expired active boosts
      const expiredBoosts = await PromotionalBoost.findAll({
        where: {
          status: 'active',
          end_time: { [Op.lt]: now }
        }
      });

      let updatedCount = 0;
      for (const boost of expiredBoosts) {
        // Remove boost from target item
        await this.removeBoost(boost);
        
        // Update boost status
        await boost.update({ status: 'expired' });
        
        updatedCount++;
      }

      console.log(`Updated ${updatedCount} expired boosts`);
      return updatedCount;
    } catch (error) {
      console.error('Error updating expired boosts:', error);
      return 0;
    }
  }

  /**
   * Get boost statistics for a user
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze
   * @returns {Object} Boost statistics
   */
  static async getUserBoostStats(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get boost counts by type
      const boostsByType = await PromotionalBoost.findAll({
        where: {
          user_id: userId,
          created_at: { [Op.gte]: startDate }
        },
        attributes: [
          'boost_type',
          'status',
          [PromotionalBoost.sequelize.fn('COUNT', PromotionalBoost.sequelize.col('id')), 'count']
        ],
        group: ['boost_type', 'status']
      });

      // Get total boosts
      const totalBoosts = await PromotionalBoost.count({
        where: {
          user_id: userId,
          created_at: { [Op.gte]: startDate }
        }
      });

      // Get active boosts
      const activeBoosts = await PromotionalBoost.count({
        where: {
          user_id: userId,
          status: 'active',
          created_at: { [Op.gte]: startDate }
        }
      });

      // Get expired boosts
      const expiredBoosts = await PromotionalBoost.count({
        where: {
          user_id: userId,
          status: 'expired',
          created_at: { [Op.gte]: startDate }
        }
      });

      return {
        totalBoosts,
        activeBoosts,
        expiredBoosts,
        cancelledBoosts: totalBoosts - activeBoosts - expiredBoosts,
        byType: boostsByType.map(item => ({
          boostType: item.boost_type,
          status: item.status,
          count: parseInt(item.dataValues.count)
        })),
        period: {
          days,
          startDate,
          endDate: new Date()
        }
      };
    } catch (error) {
      console.error('Error getting boost stats:', error);
      return null;
    }
  }

  /**
   * Get boosted items for a specific type
   * @param {string} boostType - Type of boost
   * @param {Object} options - Query options
   * @returns {Array} Boosted items
   */
  static async getBoostedItems(boostType, options = {}) {
    try {
      const { limit = 10, offset = 0, includeExpired = false } = options;

      // Map boost types to models
      const modelMap = {
        'product': Product,
        'group_buy': GroupBuy,
        'swap_deal': SwapDeal,
        'auction': Auction
      };

      const Model = modelMap[boostType];
      if (!Model) {
        throw new Error(`Invalid boost type: ${boostType}`);
      }

      // Build where clause
      const whereClause = { is_boosted: true };
      if (!includeExpired) {
        whereClause.boost_expires_at = { [Op.gt]: new Date() };
      }

      // Get boosted items
      const items = await Model.findAll({
        where: whereClause,
        order: [['boost_expires_at', 'DESC']],
        limit,
        offset
      });

      return items;
    } catch (error) {
      console.error('Error getting boosted items:', error);
      return [];
    }
  }

  /**
   * Check if an item is currently boosted
   * @param {string} boostType - Type of boost
   * @param {string} targetId - Target item ID
   * @returns {Object|null} Boost information or null
   */
  static async getItemBoostStatus(boostType, targetId) {
    try {
      // Map boost types to models
      const modelMap = {
        'product': Product,
        'group_buy': GroupBuy,
        'swap_deal': SwapDeal,
        'auction': Auction
      };

      const Model = modelMap[boostType];
      if (!Model) {
        throw new Error(`Invalid boost type: ${boostType}`);
      }

      // Get item with boost information
      const item = await Model.findByPk(targetId, {
        attributes: ['id', 'is_boosted', 'boost_expires_at', 'boost_id']
      });

      if (!item) {
        return null;
      }

      return {
        isBoosted: item.is_boosted,
        boostExpiresAt: item.boost_expires_at,
        boostId: item.boost_id,
        isExpired: item.boost_expires_at ? new Date() > item.boost_expires_at : false
      };
    } catch (error) {
      console.error('Error getting item boost status:', error);
      return null;
    }
  }

  /**
   * Get all active boosts for a user
   * @param {string} userId - User ID
   * @returns {Array} Active boosts
   */
  static async getUserActiveBoosts(userId) {
    try {
      const boosts = await PromotionalBoost.findAll({
        where: {
          user_id: userId,
          status: 'active',
          end_time: { [Op.gt]: new Date() }
        },
        order: [['end_time', 'ASC']]
      });

      return boosts;
    } catch (error) {
      console.error('Error getting user active boosts:', error);
      return [];
    }
  }

  /**
   * Cancel a boost and remove it from the target item
   * @param {string} boostId - Boost ID
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  static async cancelBoost(boostId, userId) {
    try {
      const boost = await PromotionalBoost.findOne({
        where: {
          id: boostId,
          user_id: userId,
          status: 'active'
        }
      });

      if (!boost) {
        throw new Error('Active boost not found');
      }

      // Remove boost from target item
      await this.removeBoost(boost);

      // Update boost status
      await boost.update({ status: 'cancelled' });

      return true;
    } catch (error) {
      console.error('Error cancelling boost:', error);
      return false;
    }
  }

  /**
   * Get boost performance analytics
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze
   * @returns {Object} Performance analytics
   */
  static async getBoostPerformanceAnalytics(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get boost performance data
      const boosts = await PromotionalBoost.findAll({
        where: {
          user_id: userId,
          created_at: { [Op.gte]: startDate }
        },
        order: [['created_at', 'DESC']]
      });

      // Calculate performance metrics
      const totalBoosts = boosts.length;
      const activeBoosts = boosts.filter(b => b.status === 'active').length;
      const expiredBoosts = boosts.filter(b => b.status === 'expired').length;
      const cancelledBoosts = boosts.filter(b => b.status === 'cancelled').length;

      // Calculate average duration
      const completedBoosts = boosts.filter(b => b.status === 'expired');
      const avgDuration = completedBoosts.length > 0 
        ? completedBoosts.reduce((sum, b) => sum + b.boost_duration_hours, 0) / completedBoosts.length
        : 0;

      return {
        summary: {
          totalBoosts,
          activeBoosts,
          expiredBoosts,
          cancelledBoosts,
          completionRate: totalBoosts > 0 ? (expiredBoosts / totalBoosts) * 100 : 0,
          averageDuration: Math.round(avgDuration)
        },
        byType: this.groupByType(boosts),
        period: {
          days,
          startDate,
          endDate: new Date()
        }
      };
    } catch (error) {
      console.error('Error getting boost performance analytics:', error);
      return null;
    }
  }

  /**
   * Group boosts by type
   * @param {Array} boosts - Array of boosts
   * @returns {Object} Grouped boosts
   */
  static groupByType(boosts) {
    const grouped = {};
    
    boosts.forEach(boost => {
      if (!grouped[boost.boost_type]) {
        grouped[boost.boost_type] = {
          total: 0,
          active: 0,
          expired: 0,
          cancelled: 0
        };
      }
      
      grouped[boost.boost_type].total++;
      grouped[boost.boost_type][boost.status]++;
    });

    return grouped;
  }
}

module.exports = BoostManagementService;

