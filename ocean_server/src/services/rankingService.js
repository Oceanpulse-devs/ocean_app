const { 
  Product, 
  Auction, 
  SwapDeal, 
  GroupBuy,
  VisibilityScore,
  UserSubscription,
  SubscriptionPlan,
  PromotionalBoost
} = require('../../models');
const { Op } = require('sequelize');
const promotionGatingService = require('./promotionGatingService');

/**
 * Ranking Service
 * 
 * Provides ranking functionality for items:
 * - Trending items (by visibility score)
 * - Recommended items (personalized)
 * - Similar items (category + score based)
 */
class RankingService {

  /**
   * Get trending items
   * @param {string} itemType - Item type
   * @param {Object} options - Query options (category, limit, offset, buyerLocation)
   * @returns {Array} Trending items
   */
  static async getTrendingItems(itemType, options = {}) {
    try {
      const { category = null, limit = 20, offset = 0, buyerLocation = null } = options;

      const modelMap = {
        'product': Product,
        'auction': Auction,
        'swap_deal': SwapDeal,
        'group_buy': GroupBuy,
        'distress_sale': Product
      };

      const Model = modelMap[itemType];
      if (!Model) {
        throw new Error(`Invalid item type: ${itemType}`);
      }

      // Build where clause - only show active items (excludes cancelled, inactive, completed, ended, failed, etc.)
      const whereClause = {
        status: 'active'
      };

      if (itemType === 'product' || itemType === 'distress_sale') {
        whereClause.isAvailable = true;
      }

      // Handle category filtering - different models use different field names
      if (category) {
        if (itemType === 'swap_deal') {
          // SwapDeal uses categoryToSwap (maps to category_to_swap in DB)
          whereClause.categoryToSwap = category;
        } else {
          // Products, Auctions, GroupBuys use category
          whereClause.category = category;
        }
      }

      // Get items ordered by visibility score
      const items = await Model.findAll({
        where: whereClause,
        order: [['visibility_score', 'DESC'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Apply subscription multipliers if buyer location is provided
      if (buyerLocation) {
        return await this.applySubscriptionMultipliers(items, itemType, buyerLocation);
      }

      return items;
    } catch (error) {
      console.error(`Error getting trending ${itemType}:`, error);
      return [];
    }
  }

  /**
   * Get recommended items for a user
   * @param {string} userId - User ID
   * @param {string} itemType - Item type
   * @param {Object} options - Query options (limit, offset)
   * @returns {Array} Recommended items
   */
  static async getRecommendedItems(userId, itemType, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;

      // Get user's preferences (can be enhanced with user behavior analytics)
      // For now, we'll use a simple approach based on visibility score
      // In the future, this can use ML recommendations based on:
      // - User's past views, likes, saves
      // - User's search history
      // - Similar users' preferences
      // - Category preferences

      const modelMap = {
        'product': Product,
        'auction': Auction,
        'swap_deal': SwapDeal,
        'group_buy': GroupBuy,
        'distress_sale': Product
      };

      const Model = modelMap[itemType];
      if (!Model) {
        throw new Error(`Invalid item type: ${itemType}`);
      }

      // Build where clause - only show active items (excludes cancelled, inactive, completed, ended, failed, etc.)
      const whereClause = {
        status: 'active'
      };

      if (itemType === 'product' || itemType === 'distress_sale') {
        whereClause.isAvailable = true;
      }

      // Get items with high visibility scores (recommended)
      // Can be enhanced with personalization
      const items = await Model.findAll({
        where: whereClause,
        order: [['visibility_score', 'DESC'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return items;
    } catch (error) {
      console.error(`Error getting recommended ${itemType} for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get similar items
   * @param {string} itemType - Item type
   * @param {string} itemId - Item ID
   * @param {Object} options - Query options (limit, offset)
   * @returns {Array} Similar items
   */
  static async getSimilarItems(itemType, itemId, options = {}) {
    try {
      const { limit = 10, offset = 0 } = options;

      const modelMap = {
        'product': Product,
        'auction': Auction,
        'swap_deal': SwapDeal,
        'group_buy': GroupBuy,
        'distress_sale': Product
      };

      const Model = modelMap[itemType];
      if (!Model) {
        throw new Error(`Invalid item type: ${itemType}`);
      }

      // Get the reference item
      const referenceItem = await Model.findByPk(itemId);
      if (!referenceItem) {
        return [];
      }

      // Build where clause for similar items - only show active items (excludes cancelled, inactive, completed, ended, failed, etc.)
      const whereClause = {
        id: { [Op.ne]: itemId }, // Exclude the reference item
        status: 'active'
      };

      if (itemType === 'product' || itemType === 'distress_sale') {
        whereClause.isAvailable = true;
      }

      // Find items in the same category - handle different field names per model
      if (itemType === 'swap_deal') {
        // SwapDeal uses categoryToSwap
        if (referenceItem.categoryToSwap) {
          whereClause.categoryToSwap = referenceItem.categoryToSwap;
        }
      } else {
        // Products, Auctions, GroupBuys use category
        if (referenceItem.category) {
          whereClause.category = referenceItem.category;
        }
      }

      // Get similar items ordered by visibility score
      const items = await Model.findAll({
        where: whereClause,
        order: [['visibility_score', 'DESC'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return items;
    } catch (error) {
      console.error(`Error getting similar ${itemType} for ${itemId}:`, error);
      return [];
    }
  }

  /**
   * Apply subscription multipliers to items based on buyer's location
   * This boosts items from sellers with higher-tier subscriptions
   * @param {Array} items - Items array
   * @param {string} itemType - Item type
   * @param {string} buyerLocation - Buyer's location
   * @returns {Array} Items with adjusted scores
   */
  static async applySubscriptionMultipliers(items, itemType, buyerLocation) {
    try {
      // For now, return items as-is
      // This can be enhanced to apply multipliers based on seller's subscription
      // when displaying to buyers in specific locations
      return items;
    } catch (error) {
      console.error('Error applying subscription multipliers:', error);
      return items;
    }
  }

  /**
   * Get ranking for a specific category
   * @param {string} category - Category name
   * @param {string} itemType - Item type
   * @param {Object} options - Query options (limit, offset)
   * @returns {Array} Ranked items in category
   */
  static async getRankingForCategory(category, itemType, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;

      return await this.getTrendingItems(itemType, {
        category,
        limit,
        offset
      });
    } catch (error) {
      console.error(`Error getting ranking for category ${category}:`, error);
      return [];
    }
  }
}

module.exports = RankingService;

