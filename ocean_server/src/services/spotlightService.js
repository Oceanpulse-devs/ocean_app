const { 
  SpotlightSlot, 
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
 * Spotlight Service
 * 
 * Handles spotlight/featured operations including:
 * - Creating spotlight slots with subscription validation
 * - Slot rotation logic
 * - Display order management
 * - Impression and click tracking
 * - Applying spotlights to items
 * - Handling expiration
 * - Priority placement for SURGE plan
 */
class SpotlightService {

  /**
   * Create a spotlight slot
   * @param {string} userId - User ID
   * @param {string} itemType - Item type
   * @param {string} itemId - Item ID
   * @param {Object} options - Spotlight options
   * @returns {Object} Created spotlight slot
   */
  static async createSpotlightSlot(userId, itemType, itemId, options = {}) {
    try {
      const {
        slotType = 'homepage',
        category = null,
        durationDays = 7
      } = options;

      // Validate item type
      const validTypes = ['product', 'auction', 'swap_deal', 'group_buy', 'distress_sale'];
      if (!validTypes.includes(itemType)) {
        throw new Error(`Invalid item type: ${itemType}`);
      }

      // Check eligibility
      const eligibility = await promotionGatingService.checkSpotlightEligibility(
        userId,
        slotType,
        durationDays
      );

      if (!eligibility.eligible) {
        throw new Error(eligibility.reason);
      }

      // Validate duration (7 or 14 days)
      if (![7, 14].includes(durationDays)) {
        throw new Error('Duration must be 7 or 14 days');
      }

      // Validate slot type
      const validSlotTypes = ['homepage', 'category', 'search', 'sponsored'];
      if (!validSlotTypes.includes(slotType)) {
        throw new Error(`Invalid slot type: ${slotType}`);
      }

      // Validate category if slot type is category
      if (slotType === 'category' && !category) {
        throw new Error('Category is required for category spotlight');
      }

      // Validate item exists and user owns it
      await this.validateItemOwnership(itemType, itemId, userId);

      // Check if item already has active spotlight
      const existingSpotlight = await SpotlightSlot.findOne({
        where: {
          item_type: itemType,
          item_id: itemId,
          slot_type: slotType,
          status: 'active',
          end_date: { [Op.gt]: new Date() }
        }
      });

      if (existingSpotlight) {
        throw new Error(`Item already has an active spotlight for ${slotType}`);
      }

      // Get subscription for priority calculation
      const subscription = await promotionGatingService.getUserSubscription(userId);
      const plan = subscription.plan;

      // Calculate display order (SURGE gets priority - lower number = shown first)
      // Get current max display order for this slot type
      const maxOrder = await SpotlightSlot.max('display_order', {
        where: {
          slot_type: slotType,
          category: slotType === 'category' ? category : null,
          status: 'active',
          end_date: { [Op.gt]: new Date() }
        }
      }) || 0;

      // SURGE users get lower display order (shown first)
      // TIDE users get higher display order
      const displayOrder = plan.name === 'surge' ? 0 : maxOrder + 1;

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      // Create spotlight slot
      const spotlight = await SpotlightSlot.create({
        userId: userId,
        subscriptionId: subscription.id,
        itemType: itemType,
        itemId: itemId,
        slotType: slotType,
        category: category,
        durationDays: durationDays,
        startDate: startDate,
        endDate: endDate,
        status: 'active',
        displayOrder: displayOrder,
        impressions: 0,
        clicks: 0
      });

      // Apply spotlight to item
      await this.applySpotlight(spotlight);

      // Increment usage counter
      await promotionGatingService.incrementPromotionUsage(userId, 'spotlight');

      console.log(`Created spotlight ${spotlight.id} for ${itemType} ${itemId} in ${slotType}`);
      return spotlight;
    } catch (error) {
      console.error('Error creating spotlight slot:', error);
      throw error;
    }
  }

  /**
   * Apply spotlight to an item
   * @param {Object} spotlight - Spotlight slot object
   * @returns {boolean} Success status
   */
  static async applySpotlight(spotlight) {
    try {
      // Use camelCase for Sequelize model attributes (not snake_case database columns)
      const itemType = spotlight.itemType || spotlight.item_type;
      const itemId = spotlight.itemId || spotlight.item_id;
      const spotlightId = spotlight.id;
      const endDate = spotlight.endDate || spotlight.end_date;

      if (!itemType) {
        throw new Error(`Invalid item type: ${itemType} (undefined)`);
      }

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

      // Update item with spotlight information
      await Model.update({
        is_spotlighted: true,
        spotlight_expires_at: endDate,
        spotlight_id: spotlightId
      }, {
        where: { id: itemId }
      });

      console.log(`Applied spotlight ${spotlightId} to ${itemType} ${itemId}`);
      return true;
    } catch (error) {
      console.error('Error applying spotlight:', error);
      throw error; // Changed from return false to throw error
    }
  }

  /**
   * Remove spotlight from an item
   * @param {Object} spotlight - Spotlight slot object
   * @returns {boolean} Success status
   */
  static async removeSpotlight(spotlight) {
    try {
      // Use camelCase for Sequelize model attributes (not snake_case database columns)
      const itemType = spotlight.itemType || spotlight.item_type;
      const itemId = spotlight.itemId || spotlight.item_id;

      if (!itemType) {
        throw new Error(`Invalid item type: ${itemType} (undefined)`);
      }

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

      // Remove spotlight information from item
      await Model.update({
        is_spotlighted: false,
        spotlight_expires_at: null,
        spotlight_id: null
      }, {
        where: { id: itemId }
      });

      console.log(`Removed spotlight from ${itemType} ${itemId}`);
      return true;
    } catch (error) {
      console.error('Error removing spotlight:', error);
      throw error;
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
    // Products, auctions, and distress sales use sellerId (seller account ID) - need to check seller ownership
    // GroupBuy uses creator_id (user ID) - direct comparison
    // SwapDeal uses sellerId but it's actually a user ID - direct comparison
    
    if (itemType === 'product' || itemType === 'auction' || itemType === 'distress_sale') {
      // These use sellerId (seller account ID), need to check seller ownership
      const { SellersTable } = require('../../models');
      const sellerId = item.sellerId;
      const seller = await SellersTable.findByPk(sellerId);
      if (!seller || seller.userId !== userId) {
        throw new Error(`You can only spotlight your own ${itemType}`);
      }
    } else if (itemType === 'group_buy') {
      // GroupBuy uses creator_id (user ID)
      const creatorId = item.creator_id;
      if (creatorId !== userId) {
        throw new Error(`You can only spotlight your own ${itemType}`);
      }
    } else if (itemType === 'swap_deal') {
      // SwapDeal uses sellerId but it's actually a user ID (references UserTable)
      const ownerId = item.sellerId;
      if (ownerId !== userId) {
        throw new Error(`You can only spotlight your own ${itemType}`);
      }
    }
  }

  /**
   * Get user's spotlight slots
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} Spotlight slots
   */
  static async getUserSpotlights(userId, options = {}) {
    try {
      const { status = 'active', slotType = null, itemType = null } = options; // Default to 'active'

      const whereClause = { user_id: userId };
      // Only filter by status if it's not 'all' (which means show everything)
      if (status && status !== 'all') whereClause.status = status; // This will now default to 'active'
      if (slotType) whereClause.slot_type = slotType;
      if (itemType) whereClause.item_type = itemType;

      const spotlights = await SpotlightSlot.findAll({
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

      return spotlights;
    } catch (error) {
      console.error('Error getting user spotlights:', error);
      return [];
    }
  }

  /**
   * Get spotlight items by slot type
   * @param {string} slotType - Slot type (homepage, category, search)
   * @param {Object} options - Query options
   * @returns {Array} Spotlight slots
   */
  static async getSpotlightsBySlotType(slotType, options = {}) {
    try {
      const { category = null, limit = 20, offset = 0 } = options;

      const whereClause = {
        slot_type: slotType,
        status: 'active',
        start_date: { [Op.lte]: new Date() },
        end_date: { [Op.gt]: new Date() }
      };

      if (slotType === 'category' && category) {
        whereClause.category = category;
      }

      const spotlights = await SpotlightSlot.findAll({
        where: whereClause,
        order: [['display_order', 'ASC'], ['created_at', 'ASC']], // Lower display_order first
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return spotlights;
    } catch (error) {
      console.error(`Error getting spotlights for ${slotType}:`, error);
      return [];
    }
  }

  /**
   * Get spotlight items for a category
   * @param {string} slotType - Slot type
   * @param {string} category - Category name
   * @param {Object} options - Query options
   * @returns {Array} Spotlight slots
   */
  static async getSpotlightsForCategory(slotType, category, options = {}) {
    try {
      return await this.getSpotlightsBySlotType(slotType, {
        ...options,
        category: category
      });
    } catch (error) {
      console.error(`Error getting spotlights for category ${category}:`, error);
      return [];
    }
  }

  /**
   * Track impression for a spotlight
   * @param {string} spotlightId - Spotlight ID
   * @returns {boolean} Success status
   */
  static async trackImpression(spotlightId) {
    try {
      const spotlight = await SpotlightSlot.findByPk(spotlightId);
      
      if (!spotlight) {
        return false;
      }

      // Increment impressions
      await spotlight.increment('impressions');

      return true;
    } catch (error) {
      console.error(`Error tracking impression for spotlight ${spotlightId}:`, error);
      return false;
    }
  }

  /**
   * Track click for a spotlight
   * @param {string} spotlightId - Spotlight ID
   * @returns {boolean} Success status
   */
  static async trackClick(spotlightId) {
    try {
      const spotlight = await SpotlightSlot.findByPk(spotlightId);
      
      if (!spotlight) {
        return false;
      }

      // Increment clicks
      await spotlight.increment('clicks');

      return true;
    } catch (error) {
      console.error(`Error tracking click for spotlight ${spotlightId}:`, error);
      return false;
    }
  }

  /**
   * Cancel a spotlight
   * @param {string} spotlightId - Spotlight ID
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  static async cancelSpotlight(spotlightId, userId) {
    try {
      // First check if spotlight exists (regardless of status)
      const spotlight = await SpotlightSlot.findOne({
        where: {
          id: spotlightId,
          user_id: userId
        }
      });

      if (!spotlight) {
        throw new Error('Spotlight not found');
      }

      // If already cancelled, just return success (idempotent)
      if (spotlight.status === 'cancelled') {
        console.log(`Spotlight ${spotlightId} is already cancelled`);
        return true;
      }

      // If not active, can't cancel
      if (spotlight.status !== 'active') {
        throw new Error(`Cannot cancel spotlight with status: ${spotlight.status}`);
      }

      // Remove from item
      await this.removeSpotlight(spotlight);

      // Update status
      await spotlight.update({ status: 'cancelled' });

      console.log(`Cancelled spotlight ${spotlightId}`);
      return true;
    } catch (error) {
      console.error('Error cancelling spotlight:', error);
      throw error;
    }
  }

  /**
   * Handle expired spotlights
   * @returns {Object} Expiration results
   */
  static async handleExpiredSpotlights() {
    try {
      const now = new Date();

      // Find all expired active spotlights
      const expiredSpotlights = await SpotlightSlot.findAll({
        where: {
          status: 'active',
          end_date: { [Op.lt]: now }
        }
      });

      let updatedCount = 0;
      for (const spotlight of expiredSpotlights) {
        // Remove from item
        await this.removeSpotlight(spotlight);

        // Update status
        await spotlight.update({ status: 'expired' });

        updatedCount++;
      }

      console.log(`Handled ${updatedCount} expired spotlights`);
      return {
        processed: expiredSpotlights.length,
        updated: updatedCount
      };
    } catch (error) {
      console.error('Error handling expired spotlights:', error);
      return {
        processed: 0,
        updated: 0,
        error: error.message
      };
    }
  }

  /**
   * Get spotlight analytics for a user
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze
   * @returns {Object} Analytics data
   */
  static async getSpotlightAnalytics(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const spotlights = await SpotlightSlot.findAll({
        where: {
          user_id: userId,
          created_at: { [Op.gte]: startDate }
        },
        order: [['created_at', 'DESC']]
      });

      const totalSpotlights = spotlights.length;
      const activeSpotlights = spotlights.filter(s => s.status === 'active').length;
      const expiredSpotlights = spotlights.filter(s => s.status === 'expired').length;
      const cancelledSpotlights = spotlights.filter(s => s.status === 'cancelled').length;

      // Calculate total impressions and clicks
      const totalImpressions = spotlights.reduce((sum, s) => sum + (s.impressions || 0), 0);
      const totalClicks = spotlights.reduce((sum, s) => sum + (s.clicks || 0), 0);
      const clickThroughRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

      // Group by slot type
      const bySlotType = {};
      spotlights.forEach(spotlight => {
        if (!bySlotType[spotlight.slot_type]) {
          bySlotType[spotlight.slot_type] = {
            total: 0,
            active: 0,
            expired: 0,
            cancelled: 0,
            impressions: 0,
            clicks: 0
          };
        }
        bySlotType[spotlight.slot_type].total++;
        bySlotType[spotlight.slot_type][spotlight.status]++;
        bySlotType[spotlight.slot_type].impressions += spotlight.impressions || 0;
        bySlotType[spotlight.slot_type].clicks += spotlight.clicks || 0;
      });

      // Group by item type
      const byItemType = {};
      spotlights.forEach(spotlight => {
        if (!byItemType[spotlight.item_type]) {
          byItemType[spotlight.item_type] = {
            total: 0,
            active: 0,
            expired: 0,
            cancelled: 0
          };
        }
        byItemType[spotlight.item_type].total++;
        byItemType[spotlight.item_type][spotlight.status]++;
      });

      return {
        summary: {
          totalSpotlights,
          activeSpotlights,
          expiredSpotlights,
          cancelledSpotlights,
          completionRate: totalSpotlights > 0 ? (expiredSpotlights / totalSpotlights) * 100 : 0,
          totalImpressions,
          totalClicks,
          clickThroughRate: Math.round(clickThroughRate * 100) / 100
        },
        bySlotType: bySlotType,
        byItemType: byItemType,
        period: {
          days,
          startDate,
          endDate: new Date()
        }
      };
    } catch (error) {
      console.error('Error getting spotlight analytics:', error);
      return null;
    }
  }
}

module.exports = SpotlightService;

