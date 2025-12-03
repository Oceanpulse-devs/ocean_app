const { 
  VisibilityScore, 
  Product, 
  Auction, 
  SwapDeal, 
  GroupBuy,
  SellersTable,
  ProductView,
  ProductLike,
  SavedProduct,
  UserSubscription,
  SubscriptionPlan,
  PromotionalBoost,
  TopPlacement,
  SpotlightSlot
} = require('../../models');
const { Op } = require('sequelize');
const promotionGatingService = require('./promotionGatingService');

/**
 * Visibility Score Service
 * 
 * Calculates visibility scores for items based on multiple factors:
 * - Promotion weight (boosted, top placement, spotlight)
 * - Seller reputation (verified, trust score)
 * - Media quality (video, images, AR)
 * - Engagement metrics (views, saves, messages, likes)
 * - Freshness (newer = higher, decays over time)
 * - Location match
 * - Category relevance
 */
class VisibilityScoreService {

  /**
   * Calculate visibility score for an item
   * @param {string} itemType - Type of item (product, auction, swap_deal, group_buy, distress_sale)
   * @param {string} itemId - Item ID
   * @param {Object} options - Optional parameters (buyerLocation, buyerCategory)
   * @returns {Object} Score calculation result
   */
  static async calculateVisibilityScore(itemType, itemId, options = {}) {
    try {
      const { buyerLocation = null, buyerCategory = null } = options;

      // Get the item
      const item = await this.getItem(itemType, itemId);
      if (!item) {
        throw new Error(`Item not found: ${itemType} ${itemId}`);
      }

      // Calculate score components
      const breakdown = {
        promotion_weight: await this.calculatePromotionWeight(itemType, itemId, item),
        seller_reputation: await this.calculateSellerReputation(itemType, item),
        media_quality: this.calculateMediaQuality(itemType, item),
        engagement: await this.calculateEngagement(itemType, itemId),
        freshness: this.calculateFreshness(item),
        location_match: buyerLocation ? this.calculateLocationMatch(item, buyerLocation) : 0,
        category_relevance: buyerCategory ? this.calculateCategoryRelevance(item, buyerCategory) : 0
      };

      // Calculate base score
      let baseScore = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

      // Apply subscription multiplier if item is boosted
      const multiplier = await this.getSubscriptionMultiplier(itemType, itemId, item);
      const finalScore = baseScore * multiplier;

      // Round to 2 decimal places
      const roundedScore = Math.round(finalScore * 100) / 100;

      return {
        score: roundedScore,
        baseScore: Math.round(baseScore * 100) / 100,
        multiplier: multiplier,
        breakdown: breakdown,
        calculatedAt: new Date()
      };
    } catch (error) {
      console.error(`Error calculating visibility score for ${itemType} ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get item by type and ID
   * @param {string} itemType - Item type
   * @param {string} itemId - Item ID
   * @returns {Object|null} Item object
   */
  static async getItem(itemType, itemId) {
    const modelMap = {
      'product': Product,
      'auction': Auction,
      'swap_deal': SwapDeal,
      'group_buy': GroupBuy,
      'distress_sale': Product // Distress sales use Product model
    };

    const Model = modelMap[itemType];
    if (!Model) {
      throw new Error(`Invalid item type: ${itemType}`);
    }

    return await Model.findByPk(itemId);
  }

  /**
   * Calculate promotion weight component
   * @param {string} itemType - Item type
   * @param {string} itemId - Item ID
   * @param {Object} item - Item object
   * @returns {number} Promotion weight score
   */
  static async calculatePromotionWeight(itemType, itemId, item) {
    let weight = 0;

    // Check if boosted
    if (item.is_boosted && item.boost_expires_at && new Date() < new Date(item.boost_expires_at)) {
      weight += 300;
    }

    // Check if top placed
    if (item.is_top_placed && item.top_placement_expires_at && new Date() < new Date(item.top_placement_expires_at)) {
      weight += 500;
    }

    // Check if spotlighted
    if (item.is_spotlighted && item.spotlight_expires_at && new Date() < new Date(item.spotlight_expires_at)) {
      weight += 400;
    }

    return weight;
  }

  /**
   * Calculate seller reputation component
   * @param {string} itemType - Item type
   * @param {Object} item - Item object
   * @returns {number} Seller reputation score
   */
  static async calculateSellerReputation(itemType, item) {
    let score = 0;

    // Get seller
    let sellerId = null;
    if (itemType === 'product' || itemType === 'distress_sale') {
      sellerId = item.sellerId;
    } else {
      sellerId = item.userId || item.sellerId;
    }

    if (!sellerId) {
      return 0;
    }

    // Get seller details
    const seller = await SellersTable.findByPk(sellerId);
    if (!seller) {
      return 0;
    }

    // Verified badge bonus
    if (seller.isVerified && seller.verificationStatus === 'active') {
      score += 100;
    }

    // Trust score (can be calculated from feedback, ratings, etc.)
    // For now, we'll use a simple calculation based on verification level
    if (seller.verificationLevel === 'premium') {
      score += 30;
    } else if (seller.verificationLevel === 'enterprise') {
      score += 50;
    }

    return score;
  }

  /**
   * Calculate media quality component
   * @param {string} itemType - Item type
   * @param {Object} item - Item object
   * @returns {number} Media quality score
   */
  static calculateMediaQuality(itemType, item) {
    let score = 0;

    // Check for video (if item has video field)
    if (item.videoUrl || item.video) {
      score += 50;
    }

    // Check for images
    if (item.images && Array.isArray(item.images)) {
      const imageCount = item.images.length;
      if (imageCount >= 5) {
        score += 30;
      } else if (imageCount >= 3) {
        score += 15;
      } else if (imageCount >= 1) {
        score += 5;
      }
    }

    // Check for AR model
    if (item.arModel || item.ar_model) {
      score += 40;
    }

    return score;
  }

  /**
   * Calculate engagement component
   * @param {string} itemType - Item type
   * @param {string} itemId - Item ID
   * @returns {number} Engagement score
   */
  static async calculateEngagement(itemType, itemId) {
    let score = 0;

    if (itemType === 'product' || itemType === 'distress_sale') {
      // Get views count
      const viewCount = await ProductView.count({
        where: { product_id: itemId }
      });
      score += Math.min(viewCount * 0.5, 50); // Max 50 points from views

      // Get likes count
      const likeCount = await ProductLike.count({
        where: { productId: itemId }
      });
      score += Math.min(likeCount * 2, 40); // Max 40 points from likes

      // Get saves count
      const saveCount = await SavedProduct.count({
        where: { productId: itemId }
      });
      score += Math.min(saveCount * 3, 30); // Max 30 points from saves

      // Messages/interactions (can be added later if message tracking exists)
      // score += messageCount * 1;
    } else if (itemType === 'auction') {
      // For auctions, use bid count as engagement
      const bidCount = item.bidCount || 0;
      score += Math.min(bidCount * 2, 40);
    } else if (itemType === 'swap_deal') {
      // For swap deals, use proposal count
      const proposalCount = item.proposalCount || 0;
      score += Math.min(proposalCount * 2, 40);
    } else if (itemType === 'group_buy') {
      // For group buys, use participant count
      const participantCount = item.participantCount || 0;
      score += Math.min(participantCount * 1.5, 40);
    }

    return Math.round(score);
  }

  /**
   * Calculate freshness component (decays over time)
   * @param {Object} item - Item object
   * @returns {number} Freshness score
   */
  static calculateFreshness(item) {
    const createdAt = new Date(item.createdAt || item.created_at);
    const now = new Date();
    const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);

    // Freshness decays over time
    // New items (0-1 days): 50 points
    // Recent (1-7 days): 30 points
    // Older (7-30 days): 15 points
    // Old (30+ days): 5 points
    if (daysSinceCreation <= 1) {
      return 50;
    } else if (daysSinceCreation <= 7) {
      return 30;
    } else if (daysSinceCreation <= 30) {
      return 15;
    } else {
      return 5;
    }
  }

  /**
   * Calculate location match component
   * @param {Object} item - Item object
   * @param {string} buyerLocation - Buyer's location (state or city)
   * @returns {number} Location match score
   */
  static calculateLocationMatch(item, buyerLocation) {
    if (!buyerLocation || !item.location) {
      return 0;
    }

    // Simple location matching (can be enhanced)
    const itemLocation = item.location.toLowerCase();
    const buyerLoc = buyerLocation.toLowerCase();

    if (itemLocation.includes(buyerLoc) || buyerLoc.includes(itemLocation)) {
      return 20;
    }

    return 0;
  }

  /**
   * Calculate category relevance component
   * @param {Object} item - Item object
   * @param {string} buyerCategory - Buyer's preferred category
   * @returns {number} Category relevance score
   */
  static calculateCategoryRelevance(item, buyerCategory) {
    if (!buyerCategory || !item.category) {
      return 0;
    }

    const itemCategory = item.category.toLowerCase();
    const buyerCat = buyerCategory.toLowerCase();

    if (itemCategory === buyerCat) {
      return 30;
    }

    // Check subcategory match
    if (item.subcategory && item.subcategory.toLowerCase() === buyerCat) {
      return 20;
    }

    return 0;
  }

  /**
   * Get subscription multiplier for boosted items
   * @param {string} itemType - Item type
   * @param {string} itemId - Item ID
   * @param {Object} item - Item object
   * @returns {number} Multiplier (1.0, 1.5, 2.0, or 3.0)
   */
  static async getSubscriptionMultiplier(itemType, itemId, item) {
    // Only apply multiplier if item is boosted
    if (!item.is_boosted) {
      return 1.0;
    }

    // Get the boost record
    const boost = await PromotionalBoost.findOne({
      where: {
        boost_type: itemType === 'distress_sale' ? 'product' : itemType,
        target_id: itemId,
        status: 'active',
        end_time: { [Op.gt]: new Date() }
      },
      include: [{
        model: UserSubscription,
        as: 'subscription',
        include: [{
          model: SubscriptionPlan,
          as: 'plan'
        }]
      }]
    });

    if (!boost || !boost.subscription || !boost.subscription.plan) {
      return 1.0;
    }

    const plan = boost.subscription.plan;
    return plan.boost_multiplier || 1.0;
  }

  /**
   * Calculate and save visibility score for an item
   * @param {string} itemType - Item type
   * @param {string} itemId - Item ID
   * @param {Object} options - Optional parameters
   * @returns {Object} Saved score record
   */
  static async calculateAndSaveScore(itemType, itemId, options = {}) {
    try {
      // Calculate score
      const scoreResult = await this.calculateVisibilityScore(itemType, itemId, options);

      // Save or update visibility score
      const [visibilityScore, created] = await VisibilityScore.upsert({
        item_type: itemType,
        item_id: itemId,
        visibility_score: scoreResult.score,
        score_breakdown: scoreResult.breakdown,
        calculated_at: scoreResult.calculatedAt
      }, {
        returning: true
      });

      // Update item's visibility_score and last_score_update fields
      const item = await this.getItem(itemType, itemId);
      if (item) {
        const updateData = {
          visibility_score: scoreResult.score,
          last_score_update: new Date()
        };

        await item.update(updateData);
      }

      return {
        visibilityScore: visibilityScore,
        scoreResult: scoreResult,
        created: created
      };
    } catch (error) {
      console.error(`Error calculating and saving score for ${itemType} ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get visibility score for an item
   * @param {string} itemType - Item type
   * @param {string} itemId - Item ID
   * @returns {Object|null} Visibility score record
   */
  static async getVisibilityScore(itemType, itemId) {
    try {
      return await VisibilityScore.findOne({
        where: {
          item_type: itemType,
          item_id: itemId
        }
      });
    } catch (error) {
      console.error(`Error getting visibility score for ${itemType} ${itemId}:`, error);
      return null;
    }
  }

  /**
   * Get score breakdown for an item
   * @param {string} itemType - Item type
   * @param {string} itemId - Item ID
   * @param {Object} options - Optional parameters (buyerLocation, buyerCategory)
   * @returns {Object|null} Score breakdown
   */
  static async getScoreBreakdown(itemType, itemId, options = {}) {
    try {
      const scoreRecord = await this.getVisibilityScore(itemType, itemId);
      
      if (!scoreRecord) {
        // Calculate if not exists
        const result = await this.calculateAndSaveScore(itemType, itemId, options);
        return result.scoreResult;
      }

      return {
        score: parseFloat(scoreRecord.visibility_score),
        breakdown: scoreRecord.score_breakdown || {},
        calculatedAt: scoreRecord.calculated_at
      };
    } catch (error) {
      console.error(`Error getting score breakdown for ${itemType} ${itemId}:`, error);
      return null;
    }
  }
}

module.exports = VisibilityScoreService;

