/**
 * Promotion Helper Service
 * 
 * Provides reusable helper functions for promotion logic across all item controllers.
 * Handles sorting, field inclusion, status checking, and promotion extraction.
 */

class PromotionHelperService {

  /**
   * Get numeric priority for an item based on promotion status
   * Higher number = shown first
   * @param {Object} item - Item object (can be Sequelize instance or plain object)
   * @returns {number} Priority score
   */
  static getPromotionPriority(item) {
    const now = new Date();
    
    // Check if item is top placed and not expired
    const isTopPlaced = this.isPromotionActive(item, 'top_placement');
    if (isTopPlaced) {
      return 300; // Highest priority
    }

    // Check if item is spotlighted and not expired
    const isSpotlighted = this.isPromotionActive(item, 'spotlight');
    if (isSpotlighted) {
      return 200; // Second highest priority
    }

    // Check if item is boosted and not expired
    const isBoosted = this.isPromotionActive(item, 'boost');
    if (isBoosted) {
      return 100; // Third priority
    }

    // Organic item (no active promotion)
    return 0; // Lowest priority
  }

  /**
   * Check if a specific promotion type is active for an item
   * @param {Object} item - Item object
   * @param {string} promotionType - Type of promotion ('boost', 'top_placement', 'spotlight')
   * @returns {boolean} Whether promotion is active
   */
  static isPromotionActive(item, promotionType) {
    const now = new Date();
    
    // Handle both Sequelize instances and plain objects
    const getField = (fieldName, snakeCase) => {
      return item[fieldName] !== undefined 
        ? item[fieldName] 
        : (item[snakeCase] !== undefined ? item[snakeCase] : null);
    };

    switch (promotionType) {
      case 'boost':
        const isBoosted = getField('isBoosted', 'is_boosted');
        const boostExpiresAt = getField('boostExpiresAt', 'boost_expires_at');
        return isBoosted === true && boostExpiresAt && new Date(boostExpiresAt) > now;

      case 'top_placement':
        const isTopPlaced = getField('isTopPlaced', 'is_top_placed');
        const topPlacementExpiresAt = getField('topPlacementExpiresAt', 'top_placement_expires_at');
        return isTopPlaced === true && topPlacementExpiresAt && new Date(topPlacementExpiresAt) > now;

      case 'spotlight':
        const isSpotlighted = getField('isSpotlighted', 'is_spotlighted');
        const spotlightExpiresAt = getField('spotlightExpiresAt', 'spotlight_expires_at');
        return isSpotlighted === true && spotlightExpiresAt && new Date(spotlightExpiresAt) > now;

      default:
        return false;
    }
  }

  /**
   * Sort items by promotion priority
   * Priority order: Top Placement > Spotlight > Boosted > Organic
   * Secondary sort: Visibility Score (descending)
   * Tertiary sort: Creation Date (newest first)
   * @param {Array} items - Array of items to sort
   * @returns {Array} Sorted array of items
   */
  static sortItemsByPromotionPriority(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return items;
    }

    return [...items].sort((a, b) => {
      // Primary sort: Promotion priority
      const priorityA = this.getPromotionPriority(a);
      const priorityB = this.getPromotionPriority(b);
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }

      // Secondary sort: Visibility score
      const scoreA = this.getVisibilityScore(a);
      const scoreB = this.getVisibilityScore(b);
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Higher score first
      }

      // Tertiary sort: Creation date (newest first)
      const dateA = this.getCreationDate(a);
      const dateB = this.getCreationDate(b);
      
      if (dateA && dateB) {
        return new Date(dateB) - new Date(dateA);
      }
      
      return 0;
    });
  }

  /**
   * Get visibility score from item
   * @param {Object} item - Item object
   * @returns {number} Visibility score (default: 0)
   */
  static getVisibilityScore(item) {
    const score = item.visibilityScore !== undefined 
      ? item.visibilityScore 
      : (item.visibility_score !== undefined ? item.visibility_score : 0);
    
    return parseFloat(score) || 0;
  }

  /**
   * Get creation date from item
   * @param {Object} item - Item object
   * @returns {Date|null} Creation date
   */
  static getCreationDate(item) {
    return item.createdAt !== undefined 
      ? item.createdAt 
      : (item.created_at !== undefined ? item.created_at : null);
  }

  /**
   * Include promotion fields in item response
   * Adds promotion-related fields to item object for frontend consumption
   * @param {Object} item - Item object (can be Sequelize instance or plain object)
   * @returns {Object} Item with promotion fields added
   */
  static includePromotionFields(item) {
    if (!item) {
      return item;
    }

    // Handle both Sequelize instances and plain objects
    const getField = (fieldName, snakeCase, defaultValue = null) => {
      return item[fieldName] !== undefined 
        ? item[fieldName] 
        : (item[snakeCase] !== undefined ? item[snakeCase] : defaultValue);
    };

    const now = new Date();

    // Boost fields
    const isBoosted = getField('isBoosted', 'is_boosted', false);
    const boostExpiresAt = getField('boostExpiresAt', 'boost_expires_at');
    const boostId = getField('boostId', 'boost_id');

    // Top placement fields
    const isTopPlaced = getField('isTopPlaced', 'is_top_placed', false);
    const topPlacementExpiresAt = getField('topPlacementExpiresAt', 'top_placement_expires_at');
    const topPlacementId = getField('topPlacementId', 'top_placement_id');

    // Spotlight fields
    const isSpotlighted = getField('isSpotlighted', 'is_spotlighted', false);
    const spotlightExpiresAt = getField('spotlightExpiresAt', 'spotlight_expires_at');
    const spotlightId = getField('spotlightId', 'spotlight_id');

    // Visibility score fields
    const visibilityScore = this.getVisibilityScore(item);
    const lastScoreUpdate = getField('lastScoreUpdate', 'last_score_update');

    // Determine promotion type
    let promotionType = 'organic';
    if (isTopPlaced && topPlacementExpiresAt && new Date(topPlacementExpiresAt) > now) {
      promotionType = 'top_placement';
    } else if (isSpotlighted && spotlightExpiresAt && new Date(spotlightExpiresAt) > now) {
      promotionType = 'spotlight';
    } else if (isBoosted && boostExpiresAt && new Date(boostExpiresAt) > now) {
      promotionType = 'boosted';
    }

    // Create new object with promotion fields (preserve original item structure)
    const itemWithPromotions = {
      ...item,
      // Promotion fields (camelCase for frontend)
      isBoosted: isBoosted === true && boostExpiresAt && new Date(boostExpiresAt) > now,
      boostExpiresAt: boostExpiresAt ? new Date(boostExpiresAt).toISOString() : null,
      boostId: boostId || null,
      
      isTopPlaced: isTopPlaced === true && topPlacementExpiresAt && new Date(topPlacementExpiresAt) > now,
      topPlacementExpiresAt: topPlacementExpiresAt ? new Date(topPlacementExpiresAt).toISOString() : null,
      topPlacementId: topPlacementId || null,
      
      isSpotlighted: isSpotlighted === true && spotlightExpiresAt && new Date(spotlightExpiresAt) > now,
      spotlightExpiresAt: spotlightExpiresAt ? new Date(spotlightExpiresAt).toISOString() : null,
      spotlightId: spotlightId || null,
      
      visibilityScore: visibilityScore,
      lastScoreUpdate: lastScoreUpdate ? new Date(lastScoreUpdate).toISOString() : null,
      promotionType: promotionType
    };

    // If item is a Sequelize instance, convert to JSON first
    if (item.toJSON && typeof item.toJSON === 'function') {
      const itemJson = item.toJSON();
      return {
        ...itemJson,
        ...itemWithPromotions
      };
    }

    return itemWithPromotions;
  }

  /**
   * Get promotion status for an item
   * @param {Object} item - Item object
   * @returns {Object} Promotion status details
   */
  static getPromotionStatus(item) {
    if (!item) {
      return {
        hasActivePromotion: false,
        promotionType: 'organic',
        activePromotions: [],
        expiresAt: null
      };
    }

    const now = new Date();
    const activePromotions = [];
    let primaryPromotionType = 'organic';
    let earliestExpiry = null;

    // Check boost
    const isBoosted = this.isPromotionActive(item, 'boost');
    if (isBoosted) {
      const boostExpiresAt = item.boostExpiresAt || item.boost_expires_at;
      activePromotions.push({
        type: 'boost',
        expiresAt: boostExpiresAt ? new Date(boostExpiresAt).toISOString() : null
      });
      if (boostExpiresAt && (!earliestExpiry || new Date(boostExpiresAt) < earliestExpiry)) {
        earliestExpiry = new Date(boostExpiresAt);
      }
    }

    // Check top placement
    const isTopPlaced = this.isPromotionActive(item, 'top_placement');
    if (isTopPlaced) {
      const topPlacementExpiresAt = item.topPlacementExpiresAt || item.top_placement_expires_at;
      activePromotions.push({
        type: 'top_placement',
        expiresAt: topPlacementExpiresAt ? new Date(topPlacementExpiresAt).toISOString() : null
      });
      primaryPromotionType = 'top_placement';
      if (topPlacementExpiresAt && (!earliestExpiry || new Date(topPlacementExpiresAt) < earliestExpiry)) {
        earliestExpiry = new Date(topPlacementExpiresAt);
      }
    }

    // Check spotlight
    const isSpotlighted = this.isPromotionActive(item, 'spotlight');
    if (isSpotlighted) {
      const spotlightExpiresAt = item.spotlightExpiresAt || item.spotlight_expires_at;
      activePromotions.push({
        type: 'spotlight',
        expiresAt: spotlightExpiresAt ? new Date(spotlightExpiresAt).toISOString() : null
      });
      if (primaryPromotionType === 'organic') {
        primaryPromotionType = 'spotlight';
      }
      if (spotlightExpiresAt && (!earliestExpiry || new Date(spotlightExpiresAt) < earliestExpiry)) {
        earliestExpiry = new Date(spotlightExpiresAt);
      }
    }

    return {
      hasActivePromotion: activePromotions.length > 0,
      promotionType: primaryPromotionType,
      activePromotions: activePromotions,
      expiresAt: earliestExpiry ? earliestExpiry.toISOString() : null
    };
  }

  /**
   * Extract promoted items from organic items
   * Separates items into promoted and organic arrays
   * @param {Array} items - Array of items
   * @returns {Object} Object with 'promoted' and 'organic' arrays
   */
  static extractPromotedItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        promoted: [],
        organic: []
      };
    }

    const promoted = [];
    const organic = [];

    items.forEach(item => {
      const status = this.getPromotionStatus(item);
      if (status.hasActivePromotion) {
        promoted.push(item);
      } else {
        organic.push(item);
      }
    });

    return {
      promoted,
      organic
    };
  }

  /**
   * Apply promotion fields to multiple items
   * Batch version of includePromotionFields
   * @param {Array} items - Array of items
   * @returns {Array} Array of items with promotion fields
   */
  static includePromotionFieldsBatch(items) {
    if (!Array.isArray(items)) {
      return items;
    }

    return items.map(item => this.includePromotionFields(item));
  }

  /**
   * Sort and include promotion fields in one operation
   * Convenience method for controllers
   * @param {Array} items - Array of items
   * @returns {Array} Sorted items with promotion fields
   */
  static processItemsForResponse(items) {
    if (!Array.isArray(items)) {
      return items;
    }

    // Sort by promotion priority
    const sorted = this.sortItemsByPromotionPriority(items);
    
    // Include promotion fields
    return this.includePromotionFieldsBatch(sorted);
  }

  /**
   * Get promotion badge type for frontend display
   * Maps backend promotion types to frontend badge types
   * @param {Object} item - Item object
   * @returns {string|null} Badge type ('topPlacement', 'featured', 'boosted', 'trending', null)
   */
  static getPromotionBadgeType(item) {
    if (!item) {
      return null;
    }

    const status = this.getPromotionStatus(item);
    
    if (!status.hasActivePromotion) {
      // Check if item has high visibility score (trending)
      const visibilityScore = this.getVisibilityScore(item);
      if (visibilityScore > 50) {
        return 'trending';
      }
      return null;
    }

    switch (status.promotionType) {
      case 'top_placement':
        return 'topPlacement';
      case 'spotlight':
        return 'featured';
      case 'boosted':
        return 'boosted';
      default:
        return null;
    }
  }

  /**
   * Filter items by promotion type
   * @param {Array} items - Array of items
   * @param {string} promotionType - Promotion type to filter by ('top_placement', 'spotlight', 'boosted', 'organic')
   * @returns {Array} Filtered items
   */
  static filterByPromotionType(items, promotionType) {
    if (!Array.isArray(items)) {
      return [];
    }

    if (promotionType === 'organic') {
      const { organic } = this.extractPromotedItems(items);
      return organic;
    }

    return items.filter(item => {
      const status = this.getPromotionStatus(item);
      return status.promotionType === promotionType;
    });
  }
}

module.exports = PromotionHelperService;

