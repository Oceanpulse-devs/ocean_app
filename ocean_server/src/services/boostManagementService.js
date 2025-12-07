const { PromotionalBoost, Product, GroupBuy, SwapDeal, Auction } = require('../../models');
const { Op } = require('sequelize');
const promotionGatingService = require('./promotionGatingService');

/**
 * Boost Management Service
 * 
 * Handles promotional boost operations across different models
 * including applying boosts, removing expired boosts, boost analytics,
 * auto-reboost, location targeting, and boost packages
 */

class BoostManagementService {

  /**
   * Apply a boost to a specific item
   * @param {Object} boost - Boost object
   * @returns {boolean} Success status
   */
  static async applyBoost(boost) {
    try {
      const { boostType, targetId, endTime, id: boostId } = boost;

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

      // Update the target item with boost information
      await Model.update({
        is_boosted: true,
        boost_expires_at: endTime,
        boost_id: boostId
      }, {
        where: { id: targetId }
      });

      console.log(`Applied boost ${boostId} to ${boostType} ${targetId}`);
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
      const { boostType, targetId } = boost;

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

      // Remove boost information from the target item
      await Model.update({
        is_boosted: false,
        boost_expires_at: null,
        boost_id: null
      }, {
        where: { id: targetId }
      });

      console.log(`Removed boost from ${boostType} ${targetId}`);
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
          boostType: item.boostType || item.get('boost_type'),
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
      if (!grouped[boost.boostType]) {
        grouped[boost.boostType] = {
          total: 0,
          active: 0,
          expired: 0,
          cancelled: 0
        };
      }
      
      grouped[boost.boostType].total++;
      grouped[boost.boostType][boost.status]++;
    });

    return grouped;
  }

  /**
   * Validate boost package
   * @param {string} boostPackage - Package type ('1-day', '3-day', '7-day')
   * @param {number} durationHours - Duration in hours
   * @returns {Object} Validation result
   */
  static validateBoostPackage(boostPackage, durationHours) {
    const packageMap = {
      '1-day': 24,
      '3-day': 72,
      '7-day': 168
    };

    const expectedHours = packageMap[boostPackage];
    
    if (!expectedHours) {
      return {
        valid: false,
        reason: `Invalid boost package: ${boostPackage}. Must be one of: 1-day, 3-day, 7-day`
      };
    }

    if (durationHours !== expectedHours) {
      return {
        valid: false,
        reason: `Boost package ${boostPackage} requires ${expectedHours} hours, but got ${durationHours} hours`
      };
    }

    return { valid: true };
  }

  /**
   * Calculate boost duration from package
   * @param {string} boostPackage - Package type ('1-day', '3-day', '7-day')
   * @returns {number} Duration in hours
   */
  static getDurationFromPackage(boostPackage) {
    const packageMap = {
      '1-day': 24,
      '3-day': 72,
      '7-day': 168
    };

    return packageMap[boostPackage] || 24;
  }

  /**
   * Get boost package from duration
   * @param {number} durationHours - Duration in hours
   * @returns {string} Package type
   */
  static getPackageFromDuration(durationHours) {
    if (durationHours === 24) return '1-day';
    if (durationHours === 72) return '3-day';
    if (durationHours === 168) return '7-day';
    return '1-day'; // Default
  }

  /**
   * Validate location target format
   * @param {Object} locationTarget - Location target object
   * @returns {Object} Validation result
   */
  static validateLocationTarget(locationTarget) {
    if (!locationTarget) {
      return { valid: true }; // Optional field
    }

    if (typeof locationTarget !== 'object') {
      return {
        valid: false,
        reason: 'Location target must be an object'
      };
    }

    // Expected format: { states: ['Lagos', 'Abuja'], cities: ['Ikeja', 'Victoria Island'] }
    if (locationTarget.states && !Array.isArray(locationTarget.states)) {
      return {
        valid: false,
        reason: 'Location target states must be an array'
      };
    }

    if (locationTarget.cities && !Array.isArray(locationTarget.cities)) {
      return {
        valid: false,
        reason: 'Location target cities must be an array'
      };
    }

    return { valid: true };
  }

  /**
   * Check if location matches target
   * @param {Object} locationTarget - Location target from boost
   * @param {string} userState - User's state
   * @param {string} userCity - User's city
   * @returns {boolean} Whether location matches
   */
  static matchesLocationTarget(locationTarget, userState, userCity) {
    if (!locationTarget) {
      return true; // No targeting means show to all
    }

    // Check state match
    if (locationTarget.states && locationTarget.states.length > 0) {
      if (!userState || !locationTarget.states.includes(userState)) {
        return false;
      }
    }

    // Check city match
    if (locationTarget.cities && locationTarget.cities.length > 0) {
      if (!userCity || !locationTarget.cities.includes(userCity)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get boosted items with location filtering
   * @param {string} boostType - Type of boost
   * @param {Object} options - Query options
   * @param {string} userState - User's state (optional)
   * @param {string} userCity - User's city (optional)
   * @returns {Array} Boosted items
   */
  static async getBoostedItemsWithLocation(boostType, options = {}, userState = null, userCity = null) {
    try {
      const items = await this.getBoostedItems(boostType, options);
      
      // If no location targeting, return all items
      if (!userState && !userCity) {
        return items;
      }

      // Filter by location target
      const filteredItems = [];
      for (const item of items) {
        // Get the boost for this item
        const boost = await PromotionalBoost.findOne({
          where: {
            id: item.boost_id,
            boost_type: boostType,
            target_id: item.id
          }
        });

        if (!boost || !boost.location_target) {
          // No location targeting, include item
          filteredItems.push(item);
        } else {
          // Check if location matches
          if (this.matchesLocationTarget(boost.location_target, userState, userCity)) {
            filteredItems.push(item);
          }
        }
      }

      return filteredItems;
    } catch (error) {
      console.error('Error getting boosted items with location:', error);
      return [];
    }
  }

  /**
   * Get boosts eligible for auto-reboost
   * @returns {Array} Boosts that need reboosting
   */
  static async getBoostsForAutoReboost() {
    try {
      const now = new Date();
      
      // Find expired boosts with auto-reboost enabled
      const expiredBoosts = await PromotionalBoost.findAll({
        where: {
          status: 'expired',
          auto_reboost: true,
          end_time: {
            [Op.lte]: now
          }
        },
        order: [['end_time', 'ASC']]
      });

      // Filter boosts that are due for reboost based on interval
      const boostsToReboost = [];
      for (const boost of expiredBoosts) {
        if (!boost.reboost_interval_hours) {
          continue;
        }

        const nextReboostTime = new Date(boost.end_time);
        nextReboostTime.setHours(nextReboostTime.getHours() + boost.reboost_interval_hours);

        // If it's time to reboost
        if (now >= nextReboostTime) {
          boostsToReboost.push(boost);
        }
      }

      return boostsToReboost;
    } catch (error) {
      console.error('Error getting boosts for auto-reboost:', error);
      return [];
    }
  }

  /**
   * Create a new boost with enhanced features
   * @param {string} userId - User ID
   * @param {string} boostType - Type of boost
   * @param {string} targetId - Target item ID
   * @param {Object} options - Boost options
   * @returns {Object} Created boost
   */
  static async createBoostWithOptions(userId, boostType, targetId, options = {}) {
    try {
      const {
        durationHours = 24,
        boostPackage = '1-day',
        autoReboost = false,
        reboostIntervalHours = null,
        locationTarget = null,
        isFree = false,
        reason = ''
      } = options;

      // Validate package if provided
      if (boostPackage) {
        const packageValidation = this.validateBoostPackage(boostPackage, durationHours);
        if (!packageValidation.valid) {
          throw new Error(packageValidation.reason);
        }
      }

      // Validate location target if provided
      if (locationTarget) {
        const locationValidation = this.validateLocationTarget(locationTarget);
        if (!locationValidation.valid) {
          throw new Error(locationValidation.reason);
        }
      }

      // Calculate cost
      const costInfo = await promotionGatingService.calculateBoostCost(userId, durationHours, isFree);

      // Create boost
      const startTime = new Date();
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + durationHours);

      const boost = await PromotionalBoost.create({
        userId: userId,
        subscriptionId: options.subscriptionId,
        boostType: boostType,
        targetId: targetId,
        boostDurationHours: durationHours,
        status: 'active',
        startTime: startTime,
        endTime: endTime,
        boostReason: reason,
        autoReboost: autoReboost,
        reboostIntervalHours: reboostIntervalHours,
        locationTarget: locationTarget,
        boostPackage: boostPackage,
        cost: costInfo.cost,
        isFree: isFree
      });

      // Apply boost to item
      await this.applyBoost(boost);

      return boost;
    } catch (error) {
      console.error('Error creating boost with options:', error);
      throw error;
    }
  }
}

module.exports = BoostManagementService;

