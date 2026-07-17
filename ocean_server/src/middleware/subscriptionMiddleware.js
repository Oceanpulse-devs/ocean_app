const { UserSubscription, SubscriptionPlan, SubscriptionUsage } = require('../../models');
const redisClient = require('../config/redisdb');

// Redis-based usage tracking (more reliable than database)

/**
 * Get today's usage from Redis
 * @param {string} userId - User ID
 * @param {number} subscriptionId - Subscription ID (not used in Redis version)
 * @returns {Object} Today's usage record
 */
async function getTodayUsageFromRedis(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `usage:${userId}:${today}`;
    
    // Get all usage fields from Redis
    const usage = await redisClient.hGetAll(usageKey);
    
    // Convert string values to numbers and provide defaults
    return {
      listingsCreated: parseInt(usage.listingsCreated || '0'),
      groupBuysCreated: parseInt(usage.groupBuysCreated || '0'),
      swapDealsCreated: parseInt(usage.swapDealsCreated || '0'),
      auctionsCreated: parseInt(usage.auctionsCreated || '0'),
      distressSalesCreated: parseInt(usage.distressSalesCreated || '0'),
      dmsSent: parseInt(usage.dmsSent || '0'),
      notificationsReceived: parseInt(usage.notificationsReceived || '0'),
      arProductsUsed: parseInt(usage.arProductsUsed || '0'),
      promotionalBoostsUsed: parseInt(usage.promotionalBoostsUsed || '0')
    };
  } catch (error) {
    console.error('Error getting usage from Redis:', error);
    // Return zero usage if Redis fails
    return {
      listingsCreated: 0,
      groupBuysCreated: 0,
      swapDealsCreated: 0,
      auctionsCreated: 0,
      distressSalesCreated: 0,
      dmsSent: 0,
      notificationsReceived: 0,
      arProductsUsed: 0,
      promotionalBoostsUsed: 0
    };
  }
}

/**
 * Increment usage in Redis
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action
 * @returns {boolean} Success status
 */
async function incrementUsageInRedis(userId, actionType) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `usage:${userId}:${today}`;
    
    const usageFieldMap = {
      'listings': 'listingsCreated',
      'group_buys': 'groupBuysCreated',
      'swap_deals': 'swapDealsCreated',
      'auctions': 'auctionsCreated',
      'distress_sales': 'distressSalesCreated',
      'dms': 'dmsSent',
      'notifications': 'notificationsReceived',
      'ar_products': 'arProductsUsed',
      'promotional_boosts': 'promotionalBoostsUsed'
    };
    
    const field = usageFieldMap[actionType];
    if (!field) return false;
    
    // Increment the counter atomically
    const newValue = await redisClient.hIncrBy(usageKey, field, 1);
    
    // Set expiration to end of day (24 hours from now)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const ttlSeconds = Math.floor((tomorrow.getTime() - Date.now()) / 1000);
    await redisClient.expire(usageKey, ttlSeconds);
    
    // Removed verbose logging to reduce Railway log rate limiting
    return true;
  } catch (error) {
    console.error('Error incrementing usage in Redis:', error);
    return false;
  }
}

/**
 * Subscription Middleware for Feature Gating
 * 
 * This middleware enforces subscription limits and feature access
 * based on the user's current subscription plan.
 */

/**
 * Get user's current active subscription
 * @param {string} userId - User ID
 * @returns {Object|null} Active subscription with plan details
 */
async function getUserActiveSubscription(userId) {
  try {
    // Removed verbose logging to reduce Railway log rate limiting
    
    const activeSubscription = await UserSubscription.findOne({
      where: {
        userId: userId,
        status: 'active',
        endDate: {
          [require('sequelize').Op.gt]: new Date() // Not expired
        }
      },
      include: [{
        model: SubscriptionPlan,
        as: 'plan',
        where: { isActive: true }
      }],
      order: [['created_at', 'DESC']] // Get most recent subscription
    });

    // ⚠️ CHECK IF TRIAL EXPIRED
    if (activeSubscription && activeSubscription.isTrial && activeSubscription.trialEndDate) {
      const now = new Date();
      if (now > new Date(activeSubscription.trialEndDate)) {
        // Trial has expired - return null to indicate no active subscription
        console.log('Trial expired for user:', userId);
        return null;
      }
    }

    return activeSubscription;
  } catch (error) {
    console.error('Error getting user active subscription:', error);
    return null;
  }
}

/**
 * Get user's daily usage for today
 * @param {string} userId - User ID
 * @param {number} subscriptionId - Subscription ID
 * @returns {Object} Today's usage record
 */
async function getTodayUsage(userId, subscriptionId) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    let usage = await SubscriptionUsage.findOne({
      where: {
        userId: userId,
        usagePeriod: today
      }
    });

    if (usage) {
      // If user upgraded/changed plan today, update the record's subscriptionId
      if (usage.subscriptionId !== subscriptionId) {
        await usage.update({ subscriptionId: subscriptionId });
        console.log(`Updated today's usage record with new subscriptionId: ${subscriptionId}`);
      }
    } else {
      // Create usage record if it doesn't exist
      try {
        usage = await SubscriptionUsage.create({
          userId: userId,
          subscriptionId: subscriptionId,
          usagePeriod: today
        });
      } catch (error) {
        // Handle duplicate entry error - another process might have created it
        if (error.name === 'SequelizeUniqueConstraintError' || error.code === 'ER_DUP_ENTRY') {
          usage = await SubscriptionUsage.findOne({
            where: {
              userId: userId,
              usagePeriod: today
            }
          });
          if (usage && usage.subscriptionId !== subscriptionId) {
            await usage.update({ subscriptionId: subscriptionId });
          }
        } else {
          console.error('Error creating usage record:', error);
          throw error;
        }
      }
    }

    return usage;
  } catch (error) {
    console.error('Error getting today usage:', error);
    return null;
  }
}

/**
 * Check if user can perform a specific action based on subscription limits
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action (listings, group_buys, etc.)
 * @returns {Object} { allowed: boolean, reason: string, usage: Object }
 */
async function checkSubscriptionLimit(userId, actionType) {
  try {
    const subscription = await getUserActiveSubscription(userId);
    
    // If no active subscription, user is on free plan
    if (!subscription) {
      return {
        allowed: false,
        reason: 'No active subscription. Please subscribe to access this feature.',
        usage: null,
        plan: null,
        trialExpired: false
      };
    }

    // Additional trial expiration check for feature access
    if (subscription.isTrial && subscription.trialEndDate) {
      const now = new Date();
      if (now > new Date(subscription.trialEndDate)) {
        return {
          allowed: false,
          reason: 'Your 30-day free trial has ended. Subscribe now to continue using premium features.',
          usage: null,
          plan: subscription.plan,
          trialExpired: true,
          trialExpiredAt: subscription.trialEndDate
        };
      }
    }

    const plan = subscription.plan;
    // Removed verbose logging to reduce Railway log rate limiting
    
    // Use Redis usage tracking (more reliable than database)
    const usage = await getTodayUsageFromRedis(userId);

    // Map action types to plan limits and usage fields
    const limitMap = {
      'listings': { limit: plan.maxListings, usage: usage.listingsCreated },
      'group_buys': { limit: plan.maxGroupBuys, usage: usage.groupBuysCreated },
      'swap_deals': { limit: plan.maxSwapDeals, usage: usage.swapDealsCreated },
      'auctions': { limit: plan.maxAuctions, usage: usage.auctionsCreated },
      'distress_sales': { limit: plan.maxDistressSales, usage: usage.distressSalesCreated },
      'dms': { limit: plan.maxDailyDms, usage: usage.dmsSent },
      'notifications': { limit: plan.maxDailyNotifications, usage: usage.notificationsReceived },
      'ar_products': { limit: plan.maxArProducts, usage: usage.arProductsUsed },
      'promotional_boosts': { limit: plan.maxPromotionalBoosts, usage: usage.promotionalBoostsUsed }
    };

    const action = limitMap[actionType];
    if (!action) {
      return {
        allowed: false,
        reason: 'Invalid action type.',
        usage: usage,
        plan: plan
      };
    }

    // Check if user has reached the limit
    if (action.usage >= action.limit) {
      return {
        allowed: false,
        reason: `You have reached your daily limit of ${action.limit} ${actionType}. Upgrade your plan for more access.`,
        usage: usage,
        plan: plan
      };
    }

    return {
      allowed: true,
      reason: 'Action allowed',
      usage: usage,
      plan: plan
    };
  } catch (error) {
    console.error('Error checking subscription limit:', error);
    return {
      allowed: false,
      reason: 'Error checking subscription limits. Please try again.',
      usage: null,
      plan: null
    };
  }
}

/**
 * Check if user has access to a specific feature
 * @param {string} userId - User ID
 * @param {string} featureName - Feature name (can_create_group_buy, can_use_ar, etc.)
 * @returns {Object} { allowed: boolean, reason: string, plan: Object }
 */
async function checkFeatureAccess(userId, featureName) {
  try {
    const subscription = await getUserActiveSubscription(userId);
    
    if (!subscription) {
      return {
        allowed: false,
        reason: 'No active subscription. Please subscribe to access this feature.',
        plan: null
      };
    }

    const plan = subscription.plan;
    
    // Check if the feature is enabled for this plan
    if (!plan[featureName]) {
      return {
        allowed: false,
        reason: `This feature is not available in your ${plan.display_name} plan. Upgrade to access this feature.`,
        plan: plan
      };
    }

    return {
      allowed: true,
      reason: 'Feature access granted',
      plan: plan
    };
  } catch (error) {
    console.error('Error checking feature access:', error);
    return {
      allowed: false,
      reason: 'Error checking feature access. Please try again.',
      plan: null
    };
  }
}

/**
 * Reset user's daily usage counters (used when changing plans)
 * @param {string} userId - User ID
 * @returns {boolean} Success status
 */
async function resetUserUsageCounters(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `usage:${userId}:${today}`;
    
    // Delete the usage record for today
    await redisClient.del(usageKey);
    
    console.log(`Reset usage counters for user ${userId} on ${today}`);
    return true;
  } catch (error) {
    console.error('Error resetting usage counters:', error);
    return false;
  }
}

/**
 * Increment usage counter for a specific action
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action
 * @returns {boolean} Success status
 */
async function incrementUsage(userId, actionType) {
  try {
    // Use Redis usage tracking (more reliable than database)
    return await incrementUsageInRedis(userId, actionType);
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return false;
  }
}

/**
 * Middleware to check subscription limits before allowing actions
 * @param {string} actionType - Type of action to check
 * @returns {Function} Express middleware function
 */
function checkSubscriptionLimitMiddleware(actionType) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await checkSubscriptionLimit(userId, actionType);
      
      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          message: result.reason,
          usage: result.usage,
          plan: result.plan ? {
            name: result.plan.display_name,
            price: result.plan.price,
            currency: result.plan.currency
          } : null
        });
      }

      // Add subscription info to request for use in controllers
      req.subscription = {
        plan: result.plan,
        usage: result.usage
      };

      next();
    } catch (error) {
      console.error('Subscription limit middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking subscription limits'
      });
    }
  };
}

/**
 * Middleware to check feature access
 * @param {string} featureName - Feature name to check
 * @returns {Function} Express middleware function
 */
function checkFeatureAccessMiddleware(featureName) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await checkFeatureAccess(userId, featureName);
      
      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          message: result.reason,
          plan: result.plan ? {
            name: result.plan.display_name,
            price: result.plan.price,
            currency: result.plan.currency
          } : null
        });
      }

      // Add subscription info to request
      req.subscription = {
        plan: result.plan
      };

      next();
    } catch (error) {
      console.error('Feature access middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking feature access'
      });
    }
  };
}

/**
 * Middleware to track usage after successful action
 * @param {string} actionType - Type of action to track
 * @returns {Function} Express middleware function
 */
function trackUsageMiddleware(actionType) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Store original res.json to intercept successful responses
      const originalJson = res.json;
      res.json = function(data) {
        // If the response is successful, increment usage
        if (data.success !== false) {
          incrementUsage(userId, actionType).catch(err => {
            console.error('Error tracking usage:', err);
          });
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Usage tracking middleware error:', error);
      next();
    }
  };
}

/**
 * Combined middleware for subscription checks and usage tracking
 * @param {string} actionType - Type of action
 * @param {string} featureName - Optional feature name to check
 * @returns {Array} Array of middleware functions
 */
function subscriptionMiddleware(actionType, featureName = null) {
  const middlewares = [
    checkSubscriptionLimitMiddleware(actionType)
  ];

  // Add feature access check if specified
  if (featureName) {
    middlewares.push(checkFeatureAccessMiddleware(featureName));
  }

  // Add usage tracking
  middlewares.push(trackUsageMiddleware(actionType));

  return middlewares;
}

module.exports = {
  getUserActiveSubscription,
  getTodayUsage,
  getTodayUsageFromRedis,
  checkSubscriptionLimit,
  checkFeatureAccess,
  incrementUsage,
  incrementUsageInRedis,
  resetUserUsageCounters,
  checkSubscriptionLimitMiddleware,
  checkFeatureAccessMiddleware,
  trackUsageMiddleware,
  subscriptionMiddleware
};
