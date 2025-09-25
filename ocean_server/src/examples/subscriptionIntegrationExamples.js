/**
 * SUBSCRIPTION MIDDLEWARE INTEGRATION EXAMPLES
 * 
 * This file shows how to integrate subscription middleware into existing controllers
 * to enforce subscription limits and feature access.
 */

const featureMiddleware = require('../middleware/featureMiddleware');
const subscriptionService = require('../services/subscriptionService');
const SubscriptionStatusChecker = require('../utils/subscriptionStatusChecker');

// =============================================
// EXAMPLE: PRODUCT CONTROLLER INTEGRATION
// =============================================

/**
 * Example of how to integrate subscription middleware into product controller
 */
class ProductControllerExample {
  
  /**
   * Create product with subscription limits
   * Uses: productListingMiddleware (checks daily listing limits)
   */
  static async createProduct(req, res) {
    try {
      // Middleware already checked limits and added subscription info to req
      const { title, description, price, category } = req.body;
      const sellerId = req.user.id;
      
      // Create product
      const product = await Product.create({
        title,
        description,
        price,
        category,
        sellerId
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
        subscription: {
          plan: req.subscription.plan.display_name,
          remainingListings: req.subscription.usage ? 
            req.subscription.plan.max_listings - req.subscription.usage.listings_created : 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating product',
        error: error.message
      });
    }
  }

  /**
   * Update product with subscription checks
   * Uses: productUpdateMiddleware (checks if user has priority search)
   */
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Check if user owns the product
      const product = await Product.findOne({
        where: { id, sellerId: req.user.id }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found or access denied'
        });
      }

      // Update product
      await product.update(updates);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product,
        subscription: {
          hasPrioritySearch: req.subscription.plan.has_priority_search
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating product',
        error: error.message
      });
    }
  }
}

// =============================================
// EXAMPLE: GROUP BUY CONTROLLER INTEGRATION
// =============================================

class GroupBuyControllerExample {
  
  /**
   * Create group buy with subscription checks
   * Uses: groupBuyCreationMiddleware (checks limits + feature access)
   */
  static async createGroupBuy(req, res) {
    try {
      const { title, description, productName, originalPrice, groupPrice, minBuyers } = req.body;
      const creatorId = req.user.id;
      
      // Create group buy
      const groupBuy = await GroupBuy.create({
        title,
        description,
        product_name: productName,
        original_price: originalPrice,
        group_price: groupPrice,
        min_buyers: minBuyers,
        creator_id: creatorId
      });

      res.status(201).json({
        success: true,
        message: 'Group buy created successfully',
        data: groupBuy,
        subscription: {
          plan: req.subscription.plan.display_name,
          remainingGroupBuys: req.subscription.usage ? 
            req.subscription.plan.max_group_buys - req.subscription.usage.group_buys_created : 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating group buy',
        error: error.message
      });
    }
  }

  /**
   * Join group buy (no subscription required)
   * Uses: groupBuyJoinMiddleware (allows all users)
   */
  static async joinGroupBuy(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Join group buy logic here
      // No subscription checks needed - all users can join
      
      res.json({
        success: true,
        message: 'Successfully joined group buy'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error joining group buy',
        error: error.message
      });
    }
  }
}

// =============================================
// EXAMPLE: MESSAGING CONTROLLER INTEGRATION
// =============================================

class MessagingControllerExample {
  
  /**
   * Send message with subscription limits
   * Uses: messagingMiddleware (checks daily DM limits)
   */
  static async sendMessage(req, res) {
    try {
      const { conversationId, content } = req.body;
      const senderId = req.user.id;
      
      // Send message logic here
      // Middleware already checked DM limits
      
      res.json({
        success: true,
        message: 'Message sent successfully',
        subscription: {
          plan: req.subscription.plan.display_name,
          remainingDms: req.subscription.usage ? 
            req.subscription.plan.max_daily_dms - req.subscription.usage.dms_sent : 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error sending message',
        error: error.message
      });
    }
  }
}

// =============================================
// EXAMPLE: SEARCH CONTROLLER INTEGRATION
// =============================================

class SearchControllerExample {
  
  /**
   * Search products with subscription priority
   * Uses: searchPriorityMiddleware (adds priority boost)
   */
  static async searchProducts(req, res) {
    try {
      const { query, category, location } = req.query;
      
      // Build search query with priority boost
      const searchQuery = {
        where: {
          [Op.or]: [
            { title: { [Op.like]: `%${query}%` } },
            { description: { [Op.like]: `%${query}%` } }
          ]
        },
        order: [
          // Boost results based on subscription priority
          ['isBoosted', 'DESC'],
          ['views', 'DESC'],
          ['createdAt', 'DESC']
        ]
      };

      if (category) searchQuery.where.category = category;
      if (location) searchQuery.where.location = location;

      const products = await Product.findAll(searchQuery);

      res.json({
        success: true,
        data: products,
        subscription: {
          searchPriority: req.searchPriority,
          hasVerifiedBadge: req.hasVerifiedBadge
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching products',
        error: error.message
      });
    }
  }
}

// =============================================
// EXAMPLE: SUBSCRIPTION STATUS ENDPOINT
// =============================================

class SubscriptionControllerExample {
  
  /**
   * Get user's subscription status
   * Uses: SubscriptionStatusChecker utility
   */
  static async getSubscriptionStatus(req, res) {
    try {
      const userId = req.user.id;
      
      const status = await SubscriptionStatusChecker.getUserSubscriptionStatus(userId);
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting subscription status',
        error: error.message
      });
    }
  }

  /**
   * Get user's usage statistics
   * Uses: SubscriptionStatusChecker utility
   */
  static async getUsageStats(req, res) {
    try {
      const userId = req.user.id;
      const { days = 7 } = req.query;
      
      const stats = await SubscriptionStatusChecker.getUserUsageStats(userId, parseInt(days));
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting usage stats',
        error: error.message
      });
    }
  }

  /**
   * Check if user can perform specific action
   * Uses: SubscriptionStatusChecker utility
   */
  static async checkActionEligibility(req, res) {
    try {
      const userId = req.user.id;
      const { actionType } = req.params;
      
      const eligibility = await SubscriptionStatusChecker.canPerformAction(userId, actionType);
      
      res.json({
        success: true,
        data: eligibility
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking action eligibility',
        error: error.message
      });
    }
  }
}

// =============================================
// ROUTE INTEGRATION EXAMPLES
// =============================================

/**
 * Example of how to integrate middleware into routes
 */
const exampleRoutes = {
  
  // Product routes with subscription middleware
  productRoutes: [
    {
      method: 'POST',
      path: '/products',
      middleware: featureMiddleware.productListingMiddleware,
      handler: ProductControllerExample.createProduct
    },
    {
      method: 'PUT',
      path: '/products/:id',
      middleware: featureMiddleware.productUpdateMiddleware,
      handler: ProductControllerExample.updateProduct
    }
  ],

  // Group buy routes with subscription middleware
  groupBuyRoutes: [
    {
      method: 'POST',
      path: '/group-buys',
      middleware: featureMiddleware.groupBuyCreationMiddleware,
      handler: GroupBuyControllerExample.createGroupBuy
    },
    {
      method: 'POST',
      path: '/group-buys/:id/join',
      middleware: featureMiddleware.groupBuyJoinMiddleware,
      handler: GroupBuyControllerExample.joinGroupBuy
    }
  ],

  // Messaging routes with subscription middleware
  messagingRoutes: [
    {
      method: 'POST',
      path: '/messages',
      middleware: featureMiddleware.messagingMiddleware,
      handler: MessagingControllerExample.sendMessage
    }
  ],

  // Search routes with subscription middleware
  searchRoutes: [
    {
      method: 'GET',
      path: '/search/products',
      middleware: featureMiddleware.searchPriorityMiddleware,
      handler: SearchControllerExample.searchProducts
    }
  ],

  // Subscription status routes
  subscriptionRoutes: [
    {
      method: 'GET',
      path: '/subscription/status',
      middleware: [], // No subscription middleware needed
      handler: SubscriptionControllerExample.getSubscriptionStatus
    },
    {
      method: 'GET',
      path: '/subscription/usage',
      middleware: [],
      handler: SubscriptionControllerExample.getUsageStats
    },
    {
      method: 'GET',
      path: '/subscription/check/:actionType',
      middleware: [],
      handler: SubscriptionControllerExample.checkActionEligibility
    }
  ]
};

module.exports = {
  ProductControllerExample,
  GroupBuyControllerExample,
  MessagingControllerExample,
  SearchControllerExample,
  SubscriptionControllerExample,
  exampleRoutes
};

