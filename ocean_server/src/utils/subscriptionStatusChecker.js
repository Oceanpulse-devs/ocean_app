const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');
const redisClient = require('../config/redisdb');

/**
 * Subscription Status Checker
 * 
 * Utility functions to check subscription status and limits
 * Used in controllers and other parts of the application
 */

class SubscriptionStatusChecker {
  
  /**
   * Get comprehensive subscription status for a user
   * @param {string} userId - User ID
   * @returns {Object} Complete subscription status
   */
  static async getUserSubscriptionStatus(userId) {
    try {
      // First, try to get active subscription
      let subscription = await subscriptionMiddleware.getUserActiveSubscription(userId);
      
      // If no active subscription, check for pending subscription
      // This allows users to see their subscription immediately after creation
      if (!subscription) {
        const { UserSubscription, SubscriptionPlan } = require('../../models');
        subscription = await UserSubscription.findOne({
          where: {
            userId: userId,
            status: 'pending'
          },
          include: [{
            model: SubscriptionPlan,
            as: 'plan',
            where: { isActive: true }
          }],
          order: [['created_at', 'DESC']]
        });
        
        if (subscription) {
          console.log('📋 Pending subscription found for user:', {
            userId: userId,
            subscriptionId: subscription.id,
            planId: subscription.planId,
            paymentReference: subscription.paymentReference,
            createdAt: subscription.created_at
          });
        }
      }
      
      if (!subscription) {
        return {
          hasActiveSubscription: false,
          plan: null,
          status: 'free',
          limits: this.getFreePlanLimits(),
          features: this.getFreePlanFeatures(),
          usage: null,
          expiresAt: null
        };
      }

      const plan = subscription.plan;
      // Only get usage for active subscriptions (pending subscriptions don't have usage yet)
      const usage = subscription.status === 'active' 
        ? await subscriptionMiddleware.getTodayUsage(userId, subscription.id)
        : null;

      return {
        hasActiveSubscription: subscription.status === 'active', // Only true if actually active
        plan: {
          id: plan.id,
          name: plan.name,
          displayName: plan.display_name,
          price: plan.price,
          currency: plan.currency,
          billingPeriod: plan.billing_period
        },
        status: subscription.status, // Will be 'pending' or 'active'
        limits: subscription.status === 'active' ? {
          maxListings: plan.max_listings,
          maxGroupBuys: plan.max_group_buys,
          maxSwapDeals: plan.max_swap_deals,
          maxAuctions: plan.max_auctions,
          maxDistressSales: plan.max_distress_sales,
          maxDailyDms: plan.max_daily_dms,
          maxDailyNotifications: plan.max_daily_notifications,
          maxArProducts: plan.max_ar_products,
          maxPromotionalBoosts: plan.max_promotional_boosts
        } : this.getFreePlanLimits(), // Pending subscriptions don't have access yet
        features: subscription.status === 'active' ? {
          canCreateGroupBuy: plan.can_create_group_buy,
          canCreateSwapDeals: plan.can_create_swap_deals,
          canCreateAuctions: plan.can_create_auctions,
          canCreateDistressSales: plan.can_create_distress_sales,
          canUseAr: plan.can_use_ar,
          canCustomizeShopfront: plan.can_customize_shopfront,
          hasVerifiedBadge: plan.has_verified_badge,
          hasPrioritySearch: plan.has_priority_search,
          hasBuyerInsights: plan.has_buyer_insights,
          hasUnlimitedFeatures: plan.has_unlimited_features
        } : this.getFreePlanFeatures(), // Pending subscriptions don't have features yet
        usage: usage ? {
          listingsCreated: usage.listings_created,
          groupBuysCreated: usage.group_buys_created,
          swapDealsCreated: usage.swap_deals_created,
          auctionsCreated: usage.auctions_created,
          distressSalesCreated: usage.distress_sales_created,
          dmsSent: usage.dms_sent,
          notificationsReceived: usage.notifications_received,
          arProductsUsed: usage.ar_products_used,
          promotionalBoostsUsed: usage.promotional_boosts_used
        } : null,
        expiresAt: subscription.end_date,
        paymentStatus: subscription.status // 'pending' or 'active' - indicates payment status
      };
    } catch (error) {
      console.error('Error getting user subscription status:', error);
      return {
        hasActiveSubscription: false,
        plan: null,
        status: 'error',
        limits: this.getFreePlanLimits(),
        features: this.getFreePlanFeatures(),
        usage: null,
        expiresAt: null,
        error: error.message
      };
    }
  }

  /**
   * Check if user can perform a specific action
   * @param {string} userId - User ID
   * @param {string} actionType - Type of action
   * @returns {Object} Action eligibility
   */
  static async canPerformAction(userId, actionType) {
    try {
      const result = await subscriptionMiddleware.checkSubscriptionLimit(userId, actionType);
      
      return {
        allowed: result.allowed,
        reason: result.reason,
        remaining: result.allowed ? this.calculateRemaining(result.usage, result.plan, actionType) : 0,
        plan: result.plan ? {
          name: result.plan.display_name,
          price: result.plan.price,
          currency: result.plan.currency
        } : null
      };
    } catch (error) {
      console.error('Error checking action eligibility:', error);
      return {
        allowed: false,
        reason: 'Error checking eligibility',
        remaining: 0,
        plan: null
      };
    }
  }

  /**
   * Check if user has access to a specific feature
   * @param {string} userId - User ID
   * @param {string} featureName - Feature name
   * @returns {Object} Feature access
   */
  static async hasFeatureAccess(userId, featureName) {
    try {
      const result = await subscriptionMiddleware.checkFeatureAccess(userId, featureName);
      
      return {
        allowed: result.allowed,
        reason: result.reason,
        plan: result.plan ? {
          name: result.plan.display_name,
          price: result.plan.price,
          currency: result.plan.currency
        } : null
      };
    } catch (error) {
      console.error('Error checking feature access:', error);
      return {
        allowed: false,
        reason: 'Error checking feature access',
        plan: null
      };
    }
  }

  /**
   * Get usage statistics for a user
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze
   * @returns {Object} Usage statistics
   */
  static async getUserUsageStats(userId, days = 7) {
    try {
      const subscription = await subscriptionMiddleware.getUserActiveSubscription(userId);
      
      if (!subscription) {
        return {
          hasSubscription: false,
          stats: null,
          period: days
        };
      }

      // Get usage from Redis for the specified period
      const usageData = await this.getUsageFromRedis(userId, days);

      return {
        hasSubscription: true,
        stats: usageData,
        period: days
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        hasSubscription: false,
        stats: null,
        period: days,
        error: error.message
      };
    }
  }

  /**
   * Get usage data from Redis for multiple days
   * @param {string} userId - User ID
   * @param {number} days - Number of days to get
   * @returns {Object} Usage statistics
   */
  static async getUsageFromRedis(userId, days = 7) {
    try {
      const totals = {
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

      const dailyBreakdown = [];

      // Get usage for each day
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const usageKey = `usage:${userId}:${dateStr}`;
        const usage = await redisClient.hGetAll(usageKey);
        
        if (Object.keys(usage).length > 0) {
          const dayUsage = {
            date: dateStr,
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

          // Add to totals
          totals.listingsCreated += dayUsage.listingsCreated;
          totals.groupBuysCreated += dayUsage.groupBuysCreated;
          totals.swapDealsCreated += dayUsage.swapDealsCreated;
          totals.auctionsCreated += dayUsage.auctionsCreated;
          totals.distressSalesCreated += dayUsage.distressSalesCreated;
          totals.dmsSent += dayUsage.dmsSent;
          totals.notificationsReceived += dayUsage.notificationsReceived;
          totals.arProductsUsed += dayUsage.arProductsUsed;
          totals.promotionalBoostsUsed += dayUsage.promotionalBoostsUsed;

          dailyBreakdown.push(dayUsage);
        }
      }

      return {
        totals: totals,
        dailyBreakdown: dailyBreakdown
      };
    } catch (error) {
      console.error('Error getting usage from Redis:', error);
      return {
        totals: {
          listingsCreated: 0,
          groupBuysCreated: 0,
          swapDealsCreated: 0,
          auctionsCreated: 0,
          distressSalesCreated: 0,
          dmsSent: 0,
          notificationsReceived: 0,
          arProductsUsed: 0,
          promotionalBoostsUsed: 0
        },
        dailyBreakdown: []
      };
    }
  }

  /**
   * Calculate remaining usage for an action type
   * @param {Object} usage - Usage record
   * @param {Object} plan - Subscription plan
   * @param {string} actionType - Action type
   * @returns {number} Remaining usage
   */
  static calculateRemaining(usage, plan, actionType) {
    if (!usage || !plan) return 0;

    const limitMap = {
      'listings': plan.max_listings,
      'group_buys': plan.max_group_buys,
      'swap_deals': plan.max_swap_deals,
      'auctions': plan.max_auctions,
      'distress_sales': plan.max_distress_sales,
      'dms': plan.max_daily_dms,
      'notifications': plan.max_daily_notifications,
      'ar_products': plan.max_ar_products,
      'promotional_boosts': plan.max_promotional_boosts
    };

    const usageMap = {
      'listings': usage.listings_created,
      'group_buys': usage.group_buys_created,
      'swap_deals': usage.swap_deals_created,
      'auctions': usage.auctions_created,
      'distress_sales': usage.distress_sales_created,
      'dms': usage.dms_sent,
      'notifications': usage.notifications_received,
      'ar_products': usage.ar_products_used,
      'promotional_boosts': usage.promotional_boosts_used
    };

    const limit = limitMap[actionType] || 0;
    const used = usageMap[actionType] || 0;
    
    return Math.max(0, limit - used);
  }

  /**
   * Get free plan limits (for users without subscription)
   * @returns {Object} Free plan limits
   */
  static getFreePlanLimits() {
    return {
      maxListings: 0,
      maxGroupBuys: 0,
      maxSwapDeals: 0,
      maxAuctions: 0,
      maxDistressSales: 0,
      maxDailyDms: 0,
      maxDailyNotifications: 0,
      maxArProducts: 0,
      maxPromotionalBoosts: 0
    };
  }

  /**
   * Get free plan features (for users without subscription)
   * @returns {Object} Free plan features
   */
  static getFreePlanFeatures() {
    return {
      canCreateGroupBuy: false,
      canCreateSwapDeals: false,
      canCreateAuctions: false,
      canCreateDistressSales: false,
      canUseAr: false,
      canCustomizeShopfront: false,
      hasVerifiedBadge: false,
      hasPrioritySearch: false,
      hasBuyerInsights: false,
      hasUnlimitedFeatures: false
    };
  }
}

module.exports = SubscriptionStatusChecker;
