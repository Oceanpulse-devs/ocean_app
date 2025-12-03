const { 
  TopPlacement, 
  Product, 
  Auction, 
  SwapDeal, 
  GroupBuy,
  UserSubscription,
  SubscriptionPlan
} = require('../../models');
const { Op } = require('sequelize');
const promotionGatingService = require('./promotionGatingService');

/**
 * Top Placement Service
 * 
 * Handles top placement operations including:
 * - Creating top placements with subscription validation
 * - Applying placements to items
 * - Handling expiration
 * - Priority management
 * - Category-specific placements
 */
class TopPlacementService {

  /**
   * Create a top placement
   * @param {string} userId - User ID
   * @param {string} itemType - Item type
   * @param {string} itemId - Item ID
   * @param {Object} options - Placement options
   * @returns {Object} Created placement
   */
  static async createTopPlacement(userId, itemType, itemId, options = {}) {
    try {
      const {
        category = null,
        placementType = 'category',
        durationDays = 7
      } = options;

      // Validate item type
      const validTypes = ['product', 'auction', 'swap_deal', 'group_buy', 'distress_sale'];
      if (!validTypes.includes(itemType)) {
        throw new Error(`Invalid item type: ${itemType}`);
      }

      // Check eligibility
      const eligibility = await promotionGatingService.checkTopPlacementEligibility(
        userId,
        itemType,
        durationDays
      );

      if (!eligibility.eligible) {
        throw new Error(eligibility.reason);
      }

      // Validate duration based on plan
      const subscription = await promotionGatingService.getUserSubscription(userId);
      const plan = subscription.plan;

      if (plan.name === 'tide' && durationDays !== 7) {
        throw new Error('Tide plan only supports 7-day top placements');
      }

      if (plan.name === 'surge' && ![3, 7, 14].includes(durationDays)) {
        throw new Error('Surge plan supports 3, 7, or 14-day top placements only');
      }

      // Validate placement type
      const validPlacementTypes = ['category', 'search', 'homepage'];
      if (!validPlacementTypes.includes(placementType)) {
        throw new Error(`Invalid placement type: ${placementType}`);
      }

      // Validate item exists and user owns it
      await this.validateItemOwnership(itemType, itemId, userId);

      // Check if item already has active top placement
      const existingPlacement = await TopPlacement.findOne({
        where: {
          item_type: itemType,
          item_id: itemId,
          status: 'active',
          end_date: { [Op.gt]: new Date() }
        }
      });

      if (existingPlacement) {
        throw new Error('Item already has an active top placement');
      }

      // Calculate priority (SURGE gets higher priority)
      const priority = plan.name === 'surge' ? 100 : 50;

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      // Create top placement
      const placement = await TopPlacement.create({
        userId: userId,
        subscriptionId: subscription.id,
        itemType: itemType,
        itemId: itemId,
        category: category,
        placementType: placementType,
        durationDays: durationDays,
        startDate: startDate,
        endDate: endDate,
        status: 'active',
        priority: priority
      });

      // Apply placement to item
      await this.applyTopPlacement(placement);

      // Increment usage counter
      await promotionGatingService.incrementPromotionUsage(userId, 'top_placement');

      console.log(`Created top placement ${placement.id} for ${itemType} ${itemId}`);
      return placement;
    } catch (error) {
      console.error('Error creating top placement:', error);
      throw error;
    }
  }

  /**
   * Apply top placement to an item
   * @param {Object} placement - Top placement object
   * @returns {boolean} Success status
   */
  static async applyTopPlacement(placement) {
    try {
      const { item_type, item_id, id: placementId, end_date } = placement;

      const modelMap = {
        'product': Product,
        'group_buy': GroupBuy,
        'swap_deal': SwapDeal,
        'auction': Auction,
        'distress_sale': Product
      };

      const Model = modelMap[item_type];
      if (!Model) {
        throw new Error(`Invalid item type: ${item_type}`);
      }

      // Update item with top placement information
      await Model.update({
        is_top_placed: true,
        top_placement_expires_at: end_date,
        top_placement_id: placementId
      }, {
        where: { id: item_id }
      });

      console.log(`Applied top placement ${placementId} to ${item_type} ${item_id}`);
      return true;
    } catch (error) {
      console.error('Error applying top placement:', error);
      return false;
    }
  }

  /**
   * Remove top placement from an item
   * @param {Object} placement - Top placement object
   * @returns {boolean} Success status
   */
  static async removeTopPlacement(placement) {
    try {
      const { item_type, item_id } = placement;

      const modelMap = {
        'product': Product,
        'group_buy': GroupBuy,
        'swap_deal': SwapDeal,
        'auction': Auction,
        'distress_sale': Product
      };

      const Model = modelMap[item_type];
      if (!Model) {
        throw new Error(`Invalid item type: ${item_type}`);
      }

      // Remove top placement information from item
      await Model.update({
        is_top_placed: false,
        top_placement_expires_at: null,
        top_placement_id: null
      }, {
        where: { id: item_id }
      });

      console.log(`Removed top placement from ${item_type} ${item_id}`);
      return true;
    } catch (error) {
      console.error('Error removing top placement:', error);
      return false;
    }
  }

  /**
   * Validate item ownership
   * @param {string} itemType - Item type
   * @param {string} itemId - Item ID
   * @param {string} userId - User ID
   */
  static async validateItemOwnership(itemType, itemId, userId) {
    const modelMap = {
      'product': Product,
      'group_buy': GroupBuy,
      'swap_deal': SwapDeal,
      'auction': Auction,
      'distress_sale': Product
    };

    const Model = modelMap[itemType];
    if (!Model) {
      throw new Error(`Invalid item type: ${itemType}`);
    }

    const item = await Model.findByPk(itemId);
    if (!item) {
      throw new Error(`${itemType} with ID "${itemId}" not found`);
    }

    // Check ownership
    const ownerField = itemType === 'product' || itemType === 'distress_sale' ? 'sellerId' : 'userId';
    let ownerId = item[ownerField];

    // For products, check if seller belongs to user
    if (itemType === 'product' || itemType === 'distress_sale') {
      const { SellersTable } = require('../../models');
      const seller = await SellersTable.findByPk(ownerId);
      if (!seller || seller.userId !== userId) {
        throw new Error(`You can only place your own ${itemType}`);
      }
    } else {
      if (ownerId !== userId) {
        throw new Error(`You can only place your own ${itemType}`);
      }
    }
  }

  /**
   * Get top placements for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} Top placements
   */
  static async getUserTopPlacements(userId, options = {}) {
    try {
      const { status = null, itemType = null } = options;

      const whereClause = { user_id: userId };
      if (status) whereClause.status = status;
      if (itemType) whereClause.item_type = itemType;

      const placements = await TopPlacement.findAll({
        where: whereClause,
        include: [{
          model: UserSubscription,
          as: 'subscription',
          include: [{
            model: SubscriptionPlan,
            as: 'plan'
          }]
        }],
        order: [['created_at', 'DESC']]
      });

      return placements;
    } catch (error) {
      console.error('Error getting user top placements:', error);
      return [];
    }
  }

  /**
   * Get top placements by item type
   * @param {string} itemType - Item type
   * @param {Object} options - Query options
   * @returns {Array} Top placements
   */
  static async getTopPlacementsByType(itemType, options = {}) {
    try {
      const { category = null, placementType = null, limit = 20 } = options;

      const whereClause = {
        item_type: itemType,
        status: 'active',
        start_date: { [Op.lte]: new Date() },
        end_date: { [Op.gt]: new Date() }
      };

      if (category) {
        whereClause.category = category;
      }

      if (placementType) {
        whereClause.placement_type = placementType;
      }

      const placements = await TopPlacement.findAll({
        where: whereClause,
        order: [['priority', 'DESC'], ['created_at', 'ASC']], // Higher priority first, then older first
        limit: parseInt(limit)
      });

      return placements;
    } catch (error) {
      console.error(`Error getting top placements for ${itemType}:`, error);
      return [];
    }
  }

  /**
   * Get top placements for a category
   * @param {string} itemType - Item type
   * @param {string} category - Category name
   * @param {Object} options - Query options
   * @returns {Array} Top placements
   */
  static async getTopPlacementsForCategory(itemType, category, options = {}) {
    try {
      return await this.getTopPlacementsByType(itemType, {
        ...options,
        category: category
      });
    } catch (error) {
      console.error(`Error getting top placements for category ${category}:`, error);
      return [];
    }
  }

  /**
   * Cancel a top placement
   * @param {string} placementId - Placement ID
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  static async cancelTopPlacement(placementId, userId) {
    try {
      const placement = await TopPlacement.findOne({
        where: {
          id: placementId,
          user_id: userId,
          status: 'active'
        }
      });

      if (!placement) {
        throw new Error('Active top placement not found');
      }

      // Remove from item
      await this.removeTopPlacement(placement);

      // Update status
      await placement.update({ status: 'cancelled' });

      console.log(`Cancelled top placement ${placementId}`);
      return true;
    } catch (error) {
      console.error('Error cancelling top placement:', error);
      throw error;
    }
  }

  /**
   * Handle expired top placements
   * @returns {Object} Expiration results
   */
  static async handleExpiredPlacements() {
    try {
      const now = new Date();

      // Find all expired active placements
      const expiredPlacements = await TopPlacement.findAll({
        where: {
          status: 'active',
          end_date: { [Op.lt]: now }
        }
      });

      let updatedCount = 0;
      for (const placement of expiredPlacements) {
        // Remove from item
        await this.removeTopPlacement(placement);

        // Update status
        await placement.update({ status: 'expired' });

        updatedCount++;
      }

      console.log(`Handled ${updatedCount} expired top placements`);
      return {
        processed: expiredPlacements.length,
        updated: updatedCount
      };
    } catch (error) {
      console.error('Error handling expired top placements:', error);
      return {
        processed: 0,
        updated: 0,
        error: error.message
      };
    }
  }

  /**
   * Get top placement analytics for a user
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze
   * @returns {Object} Analytics data
   */
  static async getTopPlacementAnalytics(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const placements = await TopPlacement.findAll({
        where: {
          user_id: userId,
          created_at: { [Op.gte]: startDate }
        },
        order: [['created_at', 'DESC']]
      });

      const totalPlacements = placements.length;
      const activePlacements = placements.filter(p => p.status === 'active').length;
      const expiredPlacements = placements.filter(p => p.status === 'expired').length;
      const cancelledPlacements = placements.filter(p => p.status === 'cancelled').length;

      // Group by item type
      const byType = {};
      placements.forEach(placement => {
        if (!byType[placement.item_type]) {
          byType[placement.item_type] = {
            total: 0,
            active: 0,
            expired: 0,
            cancelled: 0
          };
        }
        byType[placement.item_type].total++;
        byType[placement.item_type][placement.status]++;
      });

      return {
        summary: {
          totalPlacements,
          activePlacements,
          expiredPlacements,
          cancelledPlacements,
          completionRate: totalPlacements > 0 ? (expiredPlacements / totalPlacements) * 100 : 0
        },
        byType: byType,
        period: {
          days,
          startDate,
          endDate: new Date()
        }
      };
    } catch (error) {
      console.error('Error getting top placement analytics:', error);
      return null;
    }
  }
}

module.exports = TopPlacementService;

