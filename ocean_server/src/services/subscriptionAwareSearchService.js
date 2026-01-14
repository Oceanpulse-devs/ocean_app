const { Product, GroupBuy, SwapDeal, Auction, UserSubscription, SubscriptionPlan } = require('../../models');
const { Op, Sequelize } = require('sequelize');

/**
 * Subscription-Aware Search Service
 * 
 * Handles search operations with subscription-based prioritization
 * including verified seller badges, search priority boosts, and feature gating
 */

class SubscriptionAwareSearchService {

  /**
   * Search products with subscription-based prioritization
   * @param {Object} searchParams - Search parameters
   * @param {string} userId - User ID (optional)
   * @returns {Object} Search results with subscription info
   */
  static async searchProducts(searchParams, userId = null) {
    try {
      const { 
        query, 
        category, 
        location, 
        minPrice, 
        maxPrice, 
        condition,
        page = 1, 
        limit = 20,
        sortBy = 'relevance'
      } = searchParams;

      // Build base where clause
      const whereClause = { status: 'active', isAvailable: true };
      
      if (query) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } },
          { brand: { [Op.like]: `%${query}%` } }
        ];
      }
      
      if (category) whereClause.category = category;
      if (location) whereClause.location = { [Op.like]: `%${location}%` };
      if (minPrice) whereClause.price = { [Op.gte]: minPrice };
      if (maxPrice) whereClause.price = { ...whereClause.price, [Op.lte]: maxPrice };
      if (condition) whereClause.condition = condition;

      // Calculate pagination
      const offset = (page - 1) * limit;

      // Build order clause based on subscription priorities
      let orderClause = [];
      
      // Priority 1: Boosted items first
      orderClause.push(['isBoosted', 'DESC']);
      
      // Priority 2: Verified sellers (if user has subscription)
      if (userId) {
        const userSubscription = await this.getUserActiveSubscription(userId);
        if (userSubscription && userSubscription.plan.has_priority_search) {
          orderClause.push(['sellerVerified', 'DESC']);
        }
      }
      
      // Priority 3: Sort by specified criteria
      switch (sortBy) {
        case 'price_low':
          orderClause.push(['price', 'ASC']);
          break;
        case 'price_high':
          orderClause.push(['price', 'DESC']);
          break;
        case 'newest':
          orderClause.push(['createdAt', 'DESC']);
          break;
        case 'popular':
          orderClause.push(['views', 'DESC']);
          break;
        default: // relevance
          orderClause.push(['views', 'DESC'], ['createdAt', 'DESC']);
      }

      // Get products with seller information
      const { count, rows: products } = await Product.findAndCountAll({
        where: whereClause,
        include: [{
          model: require('../../models').SellersTable,
          as: 'seller',
          attributes: ['id', 'businessName', 'isVerified', 'verificationLevel', 'trustScore'],
          required: true
        }],
        order: orderClause,
        limit: parseInt(limit),
        offset: offset
      });

      // Add subscription-aware metadata to each product
      const enhancedProducts = products.map(product => ({
        ...product.toJSON(),
        subscription: {
          isBoosted: product.isBoosted,
          boostExpiresAt: product.boostExpiresAt,
          sellerVerified: product.seller.isVerified,
          sellerTrustScore: product.seller.trustScore,
          priorityScore: this.calculatePriorityScore(product, userId)
        }
      }));

      return {
        products: enhancedProducts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        },
        searchInfo: {
          query,
          category,
          location,
          hasSubscriptionPriority: userId ? await this.userHasSearchPriority(userId) : false
        }
      };
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Search group buys with subscription prioritization
   * @param {Object} searchParams - Search parameters
   * @param {string} userId - User ID (optional)
   * @returns {Object} Search results
   */
  static async searchGroupBuys(searchParams, userId = null) {
    try {
      const { 
        query, 
        category, 
        subcategory,
        location, 
        minPrice, 
        maxPrice,
        page = 1, 
        limit = 20 
      } = searchParams;

      // Build where clause
      const whereClause = { status: 'active' };
      
      if (query) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } },
          { product_name: { [Op.like]: `%${query}%` } }
        ];
      }
      
      // Category filter - case-insensitive matching on category field
      if (category) {
        whereClause.category = Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('GroupBuy.category')),
          { [Op.like]: `%${category.trim().toLowerCase()}%` }
        );
      }
      
      // Subcategory filter - case-insensitive matching
      if (subcategory) {
        whereClause.subcategory = Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('GroupBuy.subcategory')),
          { [Op.like]: `%${subcategory.trim().toLowerCase()}%` }
        );
      }
      
      if (location) whereClause.location = { [Op.like]: `%${location}%` };
      if (minPrice) whereClause.group_price = { [Op.gte]: minPrice };
      if (maxPrice) whereClause.group_price = { ...whereClause.group_price, [Op.lte]: maxPrice };

      const offset = (page - 1) * limit;

      // Build order with subscription priorities
      const orderClause = [
        ['is_boosted', 'DESC'],
        ['is_featured', 'DESC'],
        ['views_count', 'DESC'],
        ['createdAt', 'DESC']
      ];

      const { count, rows: groupBuys } = await GroupBuy.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: require('../../models').UserTable,
            as: 'creator',
            attributes: ['id', 'fullName', 'username']
          }
        ],
        order: orderClause,
        limit: parseInt(limit),
        offset: offset
      });

      return {
        groupBuys: groupBuys.map(gb => ({
          ...gb.toJSON(),
          subscription: {
            isBoosted: gb.is_boosted,
            boostExpiresAt: gb.boost_expires_at
          }
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      console.error('Error searching group buys:', error);
      throw error;
    }
  }

  /**
   * Search auctions with subscription prioritization
   * @param {Object} searchParams - Search parameters
   * @param {string} userId - User ID (optional)
   * @returns {Object} Search results
   */
  static async searchAuctions(searchParams, userId = null) {
    try {
      const { 
        query, 
        category, 
        location, 
        minPrice, 
        maxPrice,
        status = 'active',
        page = 1, 
        limit = 20 
      } = searchParams;

      // Build where clause
      const whereClause = { status };
      
      if (query) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } }
        ];
      }
      
      if (category) whereClause.category = category;
      if (location) whereClause.location = { [Op.like]: `%${location}%` };
      if (minPrice) whereClause.currentPrice = { [Op.gte]: minPrice };
      if (maxPrice) whereClause.currentPrice = { ...whereClause.currentPrice, [Op.lte]: maxPrice };

      const offset = (page - 1) * limit;

      // Build order with subscription priorities
      const orderClause = [
        ['isBoosted', 'DESC'],
        ['endTime', 'ASC'], // Ending soon first
        ['views', 'DESC']
      ];

      const { count, rows: auctions } = await Auction.findAndCountAll({
        where: whereClause,
        include: [{
          model: require('../../models').SellersTable,
          as: 'seller',
          attributes: ['id', 'businessName', 'isVerified', 'verificationLevel'],
          required: true
        }],
        order: orderClause,
        limit: parseInt(limit),
        offset: offset
      });

      return {
        auctions: auctions.map(auction => ({
          ...auction.toJSON(),
          subscription: {
            isBoosted: auction.isBoosted,
            boostExpiresAt: auction.boostExpiresAt,
            sellerVerified: auction.seller.isVerified
          }
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      console.error('Error searching auctions:', error);
      throw error;
    }
  }

  /**
   * Get user's active subscription
   * @param {string} userId - User ID
   * @returns {Object|null} Active subscription
   */
  static async getUserActiveSubscription(userId) {
    try {
      const subscription = await UserSubscription.findOne({
        where: {
          user_id: userId,
          status: 'active',
          end_date: { [Op.gt]: new Date() }
        },
        include: [{
          model: SubscriptionPlan,
          as: 'plan'
        }],
        order: [['created_at', 'DESC']]
      });

      return subscription;
    } catch (error) {
      console.error('Error getting user active subscription:', error);
      return null;
    }
  }

  /**
   * Check if user has search priority
   * @param {string} userId - User ID
   * @returns {boolean} Has search priority
   */
  static async userHasSearchPriority(userId) {
    try {
      const subscription = await this.getUserActiveSubscription(userId);
      return subscription && subscription.plan.has_priority_search;
    } catch (error) {
      console.error('Error checking search priority:', error);
      return false;
    }
  }

  /**
   * Calculate priority score for a product
   * @param {Object} product - Product object
   * @param {string} userId - User ID
   * @returns {number} Priority score
   */
  static calculatePriorityScore(product, userId) {
    let score = 0;
    
    // Boosted items get highest priority
    if (product.isBoosted) score += 100;
    
    // Verified sellers get priority
    if (product.seller && product.seller.isVerified) score += 50;
    
    // Trust score contributes to priority
    if (product.seller && product.seller.trustScore) {
      score += product.seller.trustScore;
    }
    
    // View count contributes to priority
    score += Math.min(product.views || 0, 50);
    
    return score;
  }

  /**
   * Get trending products based on subscription data
   * @param {Object} options - Options
   * @returns {Array} Trending products
   */
  static async getTrendingProducts(options = {}) {
    try {
      const { limit = 10, category = null, days = 7 } = options;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const whereClause = { 
        isAvailable: true,
        createdAt: { [Op.gte]: startDate }
      };
      
      if (category) whereClause.category = category;

      const products = await Product.findAll({
        where: whereClause,
        include: [{
          model: require('../../models').SellersTable,
          as: 'seller',
          attributes: ['id', 'businessName', 'isVerified', 'verificationLevel'],
          required: true
        }],
        order: [
          ['isBoosted', 'DESC'],
          ['views', 'DESC'],
          ['saves', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: parseInt(limit)
      });

      return products.map(product => ({
        ...product.toJSON(),
        subscription: {
          isBoosted: product.isBoosted,
          boostExpiresAt: product.boostExpiresAt,
          sellerVerified: product.seller.isVerified,
          trendingScore: this.calculateTrendingScore(product)
        }
      }));
    } catch (error) {
      console.error('Error getting trending products:', error);
      return [];
    }
  }

  /**
   * Calculate trending score for a product
   * @param {Object} product - Product object
   * @returns {number} Trending score
   */
  static calculateTrendingScore(product) {
    const views = product.views || 0;
    const saves = product.saves || 0;
    const likes = product.likes || 0;
    const daysSinceCreated = Math.max(1, Math.ceil((new Date() - product.createdAt) / (1000 * 60 * 60 * 24)));
    
    // Calculate score based on engagement and recency
    const engagementScore = (views * 1) + (saves * 3) + (likes * 2);
    const recencyScore = Math.max(0, 7 - daysSinceCreated);
    
    return engagementScore + (recencyScore * 10);
  }

  /**
   * Search swap deals with subscription prioritization
   * @param {Object} searchParams - Search parameters
   * @param {string} userId - User ID (optional)
   * @returns {Object} Search results
   */
  static async searchSwapDeals(searchParams, userId = null) {
    try {
      const { 
        query, 
        status = 'pending',
        initiatorId, 
        responderId, 
        featured,
        page = 1, 
        limit = 20 
      } = searchParams;

      // Build where clause
      const whereClause = {};
      
      if (query) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } }
        ];
      }
      
      if (status) whereClause.status = status;
      if (initiatorId) whereClause.initiator_id = initiatorId;
      if (responderId) whereClause.responder_id = responderId;
      if (featured !== undefined && featured !== null) whereClause.is_featured = featured;

      const offset = (page - 1) * limit;

      // Build order with subscription priorities
      let orderClause = [];
      
      // Priority 1: Boosted items first
      orderClause.push(['is_boosted', 'DESC']);
      
      // Priority 2: Featured items
      orderClause.push(['is_featured', 'DESC']);
      
      // Priority 3: Verified sellers (if user has subscription)
      if (userId) {
        const userSubscription = await this.getUserActiveSubscription(userId);
        if (userSubscription && userSubscription.plan.has_priority_search) {
          // This would require a join with user verification status
          // For now, we'll prioritize by views and creation date
        }
      }
      
      // Priority 4: Sort by views and creation date
      orderClause.push(['views_count', 'DESC']);
      orderClause.push(['created_at', 'DESC']);

      const { count, rows: swapDeals } = await SwapDeal.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: require('../../models').UserTable,
            as: 'initiator',
            attributes: ['id', 'fullName', 'username', 'profilePicture', 'email']
          },
          {
            model: require('../../models').UserTable,
            as: 'responder',
            attributes: ['id', 'fullName', 'username', 'profilePicture', 'email']
          },
          {
            model: require('../../models').Product,
            as: 'initiatorItem',
            attributes: ['id', 'title', 'description', 'price', 'images', 'condition', 'category']
          },
          {
            model: require('../../models').Product,
            as: 'responderItem',
            attributes: ['id', 'title', 'description', 'price', 'images', 'condition', 'category']
          }
        ],
        order: orderClause,
        limit: parseInt(limit),
        offset: offset
      });

      // Add subscription-aware metadata to each swap deal
      const enhancedSwapDeals = swapDeals.map(swapDeal => ({
        ...swapDeal.toJSON(),
        subscription: {
          isBoosted: swapDeal.isBoosted,
          boostExpiresAt: swapDeal.boostExpiresAt,
          isFeatured: swapDeal.is_featured,
          viewsCount: swapDeal.views_count,
          priorityScore: this.calculateSwapDealPriorityScore(swapDeal, userId)
        }
      }));

      return {
        swapDeals: enhancedSwapDeals,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        },
        searchInfo: {
          query,
          status,
          initiatorId,
          responderId,
          featured,
          hasSubscriptionPriority: userId ? await this.userHasSearchPriority(userId) : false
        }
      };
    } catch (error) {
      console.error('Error searching swap deals:', error);
      throw error;
    }
  }

  /**
   * Calculate priority score for a swap deal
   * @param {Object} swapDeal - Swap deal object
   * @param {string} userId - User ID
   * @returns {number} Priority score
   */
  static calculateSwapDealPriorityScore(swapDeal, userId) {
    let score = 0;
    
    // Boosted items get highest priority
    if (swapDeal.isBoosted) score += 100;
    
    // Featured items get priority
    if (swapDeal.is_featured) score += 50;
    
    // Views count contributes to priority
    score += Math.min(swapDeal.views_count || 0, 50);
    
    // Recent items get slight priority
    const daysSinceCreated = Math.max(1, Math.ceil((new Date() - swapDeal.createdAt) / (1000 * 60 * 60 * 24)));
    const recencyScore = Math.max(0, 7 - daysSinceCreated);
    score += recencyScore * 5;
    
    return score;
  }
}

module.exports = SubscriptionAwareSearchService;

