const subscriptionMiddleware = require('./subscriptionMiddleware');

/**
 * Feature-Specific Subscription Middleware
 * 
 * Pre-configured middleware for specific features based on subscription plans:
 * - Product listings
 * - Group buys
 * - Swap deals
 * - Auctions
 * - Distress sales
 * - Messaging
 * - AR features
 * - Promotional boosts
 */

// =============================================
// PRODUCT LISTINGS MIDDLEWARE
// =============================================

/**
 * Middleware for creating product listings
 * Checks daily listing limits based on subscription plan
 */
const productListingMiddleware = subscriptionMiddleware.subscriptionMiddleware('listings');

/**
 * Middleware for updating product listings
 * Only allows updates if user has active subscription
 */
const productUpdateMiddleware = subscriptionMiddleware.checkFeatureAccessMiddleware('has_priority_search');

// =============================================
// GROUP BUY MIDDLEWARE
// =============================================

/**
 * Middleware for creating group buys
 * Checks both daily limits and feature access
 */
const groupBuyCreationMiddleware = subscriptionMiddleware.subscriptionMiddleware(
  'group_buys', 
  'can_create_group_buy'
);

/**
 * Middleware for joining group buys
 * All plans can join group buys
 */
const groupBuyJoinMiddleware = (req, res, next) => {
  // All users can join group buys regardless of subscription
  next();
};

// =============================================
// SWAP DEALS MIDDLEWARE
// =============================================

/**
 * Middleware for creating swap deals
 * Checks both daily limits and feature access
 */
const swapDealCreationMiddleware = subscriptionMiddleware.subscriptionMiddleware(
  'swap_deals', 
  'can_create_swap_deals'
);

/**
 * Middleware for responding to swap deals
 * All plans can respond to swap deals
 */
const swapDealResponseMiddleware = (req, res, next) => {
  // All users can respond to swap deals regardless of subscription
  next();
};

// =============================================
// AUCTION MIDDLEWARE
// =============================================

/**
 * Middleware for creating auctions
 * Checks both daily limits and feature access
 */
const auctionCreationMiddleware = subscriptionMiddleware.subscriptionMiddleware(
  'auctions', 
  'can_create_auctions'
);

/**
 * Middleware for bidding on auctions
 * All plans can bid on auctions
 */
const auctionBiddingMiddleware = (req, res, next) => {
  // All users can bid on auctions regardless of subscription
  next();
};

// =============================================
// DISTRESS SALES MIDDLEWARE
// =============================================

/**
 * Middleware for creating distress sales
 * Checks both daily limits and feature access
 */
const distressSaleCreationMiddleware = subscriptionMiddleware.subscriptionMiddleware(
  'distress_sales', 
  'can_create_distress_sales'
);

/**
 * Middleware for viewing distress sales
 * All plans can view distress sales
 */
const distressSaleViewMiddleware = (req, res, next) => {
  // All users can view distress sales regardless of subscription
  next();
};

// =============================================
// MESSAGING MIDDLEWARE
// =============================================

/**
 * Middleware for sending direct messages
 * Checks daily DM limits based on subscription plan
 */
const messagingMiddleware = subscriptionMiddleware.subscriptionMiddleware('dms');

/**
 * Middleware for receiving notifications
 * Checks daily notification limits
 */
const notificationMiddleware = subscriptionMiddleware.subscriptionMiddleware('notifications');

// =============================================
// AR FEATURES MIDDLEWARE
// =============================================

/**
 * Middleware for using AR features
 * Checks both daily limits and feature access
 */
const arFeaturesMiddleware = subscriptionMiddleware.subscriptionMiddleware(
  'ar_products', 
  'can_use_ar'
);

// =============================================
// PROMOTIONAL BOOSTS MIDDLEWARE
// =============================================

/**
 * Middleware for creating promotional boosts
 * Checks daily boost limits
 */
const promotionalBoostMiddleware = subscriptionMiddleware.subscriptionMiddleware('promotional_boosts');

// =============================================
// BUYER NEEDS BOARD MIDDLEWARE
// =============================================

/**
 * Middleware for posting to buyer needs board
 * All plans can post buyer needs
 */
const buyerNeedsPostMiddleware = (req, res, next) => {
  // All users can post buyer needs regardless of subscription
  next();
};

/**
 * Middleware for responding to buyer needs
 * Checks daily DM limits for responses
 */
const buyerNeedsResponseMiddleware = subscriptionMiddleware.subscriptionMiddleware('dms');

// =============================================
// SEARCH PRIORITY MIDDLEWARE
// =============================================

/**
 * Middleware to add search priority based on subscription
 * Adds priority boost to search results for paid plans
 */
const searchPriorityMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      req.searchPriority = 0;
      return next();
    }

    const subscription = await subscriptionMiddleware.getUserActiveSubscription(userId);
    
    if (subscription && subscription.plan && subscription.plan.has_priority_search) {
      // Add priority boost based on plan
      const priorityMap = {
        'wave': 1,
        'tide': 2,
        'surge': 3
      };
      req.searchPriority = priorityMap[subscription.plan.name] || 0;
    } else {
      req.searchPriority = 0;
    }

    next();
  } catch (error) {
    console.error('Search priority middleware error:', error);
    req.searchPriority = 0;
    next();
  }
};

// =============================================
// VERIFIED BADGE MIDDLEWARE
// =============================================

/**
 * Middleware to check if user has verified seller badge
 * Adds verified status to request for paid plans
 */
const verifiedBadgeMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      req.hasVerifiedBadge = false;
      return next();
    }

    const subscription = await subscriptionMiddleware.getUserActiveSubscription(userId);
    
    if (subscription && subscription.plan && subscription.plan.has_verified_badge) {
      req.hasVerifiedBadge = true;
    } else {
      req.hasVerifiedBadge = false;
    }

    next();
  } catch (error) {
    console.error('Verified badge middleware error:', error);
    req.hasVerifiedBadge = false;
    next();
  }
};

// =============================================
// BUYER INSIGHTS MIDDLEWARE
// =============================================

/**
 * Middleware for accessing buyer search insights
 * Only available for Surge plan
 */
const buyerInsightsMiddleware = subscriptionMiddleware.checkFeatureAccessMiddleware('has_buyer_insights');

// =============================================
// SHOPFRONT CUSTOMIZATION MIDDLEWARE
// =============================================

/**
 * Middleware for shopfront customization
 * Only available for Tide and Surge plans
 */
const shopfrontCustomizationMiddleware = subscriptionMiddleware.checkFeatureAccessMiddleware('can_customize_shopfront');

// =============================================
// EXPORT ALL MIDDLEWARE
// =============================================

module.exports = {
  // Product listings
  productListingMiddleware,
  productUpdateMiddleware,
  
  // Group buys
  groupBuyCreationMiddleware,
  groupBuyJoinMiddleware,
  
  // Swap deals
  swapDealCreationMiddleware,
  swapDealResponseMiddleware,
  
  // Auctions
  auctionCreationMiddleware,
  auctionBiddingMiddleware,
  
  // Distress sales
  distressSaleCreationMiddleware,
  distressSaleViewMiddleware,
  
  // Messaging
  messagingMiddleware,
  notificationMiddleware,
  
  // AR features
  arFeaturesMiddleware,
  
  // Promotional boosts
  promotionalBoostMiddleware,
  
  // Buyer needs
  buyerNeedsPostMiddleware,
  buyerNeedsResponseMiddleware,
  
  // Search and visibility
  searchPriorityMiddleware,
  verifiedBadgeMiddleware,
  
  // Premium features
  buyerInsightsMiddleware,
  shopfrontCustomizationMiddleware
};

