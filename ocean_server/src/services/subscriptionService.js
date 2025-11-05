const { UserSubscription, SubscriptionPlan, SubscriptionUsage, PromotionalBoost, UserTable } = require('../../models');
const { Op } = require('sequelize');
const { resetUserUsageCounters, getTodayUsageFromRedis, incrementUsageInRedis } = require('../middleware/subscriptionMiddleware');

/**
 * Subscription Service
 * 
 * Advanced subscription management functions including:
 * - Subscription creation and management
 * - Usage analytics and reporting
 * - Promotional boost management
 * - Subscription status monitoring
 */

class SubscriptionService {
  
  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const user = await UserTable.findByPk(userId, {
        attributes: ['id', 'email', 'fullName', 'username']
      });
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new subscription for a user
   * @param {string} userId - User ID
   * @param {number} planId - Plan ID
   * @param {Object} paymentData - Payment information
   * @returns {Object} Created subscription
   */
  async createSubscription(userId, planId, paymentData = {}) {
    try {
      console.log('Creating subscription for user:', userId, 'planId:', planId);
      const plan = await SubscriptionPlan.findByPk(planId);
      console.log('Plan found by ID:', plan ? {
        id: plan.id,
        name: plan.name,
        is_active: plan.isActive
      } : 'null');
      
      if (!plan || !plan.isActive) {
        throw new Error('Invalid or inactive subscription plan');
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (plan.billingPeriod === 'yearly' ? 12 : 1));

      // Create subscription
      const subscription = await UserSubscription.create({
        userId: userId,
        planId: planId,
        status: 'pending',
        startDate: startDate,
        endDate: endDate,
        autoRenew: true,
        paymentReference: paymentData.reference || null,
        paymentMethod: paymentData.method || null,
        amountPaid: plan.price,
        currency: plan.currency
      });

      // Update user's subscription status to 'pending' (not 'active' until payment verified)
      // This ensures subscription stays pending until payment callback activates it
      await this.updateUserSubscriptionStatus(userId, 'pending', planId, endDate);

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Update user's subscription status in users table
   * @param {string} userId - User ID
   * @param {string} status - Subscription status
   * @param {number} planId - Plan ID
   * @param {Date} expiresAt - Expiration date
   */
  async updateUserSubscriptionStatus(userId, status, planId, expiresAt) {
    try {
      const { UserTable, UserSubscription } = require('../../models');
      
      // If activating a new subscription, cancel all existing active subscriptions first
      if (status === 'active' && planId) {
        console.log('Cancelling existing active subscriptions for user:', userId);
        
        await UserSubscription.update({
          status: 'cancelled',
          cancellationReason: 'Upgraded to new plan',
          cancelledAt: new Date()
        }, {
          where: { 
            userId: userId,
            status: 'active'
          }
        });
        
        console.log('Cancelled existing active subscriptions');
        
        // Reset usage counters when changing plans to prevent downgrade blocking
        await this.resetUserUsageCounters(userId);
        console.log('Reset usage counters for plan change');
      }
      
      // Update users table
      await UserTable.update({
        subscription_status: status,
        current_plan_id: planId,
        subscription_expires_at: expiresAt
      }, {
        where: { id: userId }
      });

      // Also update user_subscriptions table if status is 'active'
      if (status === 'active') {
        console.log('🔍 Activating subscription:', { userId, planId, expiresAt });
        
        // ALWAYS try to find pending subscription first (most reliable)
        // This ensures we find the subscription even if planId is missing from metadata
        let subscription = await UserSubscription.findOne({
          where: { 
            userId: userId,
            status: 'pending'
          },
          order: [['created_at', 'DESC']]
        });
        
        console.log('🔍 Pending subscription search result:', subscription ? {
          id: subscription.id,
          planId: subscription.planId,
          paymentReference: subscription.paymentReference,
          createdAt: subscription.created_at
        } : 'null');
        
        // If not found by pending status, try with planId if provided
        if (!subscription && planId) {
          console.log('🔍 Trying to find subscription by userId + planId:', { userId, planId });
          subscription = await UserSubscription.findOne({
            where: { 
              userId: userId,
              planId: planId
            },
            order: [['created_at', 'DESC']]
          });
          
          console.log('🔍 Subscription by userId + planId result:', subscription ? {
            id: subscription.id,
            status: subscription.status
          } : 'null');
        }
        
        // If found, update it
        if (subscription) {
          // Use subscription's planId if planId param is missing
          const finalPlanId = planId || subscription.planId;
          const finalExpiresAt = expiresAt || subscription.endDate;
          
          console.log('✅ Found subscription to activate:', {
            subscriptionId: subscription.id,
            currentStatus: subscription.status,
            finalPlanId: finalPlanId,
            finalExpiresAt: finalExpiresAt
          });
          
          await UserSubscription.update({
            status: status,
            endDate: finalExpiresAt
          }, {
            where: { id: subscription.id }
          });
          
          console.log('✅ Updated user_subscriptions table for subscription:', subscription.id);
          
          // Also ensure users table has the correct planId
          if (finalPlanId && finalPlanId !== planId) {
            await UserTable.update({
              current_plan_id: finalPlanId
            }, {
              where: { id: userId }
            });
            console.log('✅ Updated users table with correct planId:', finalPlanId);
          }
        } else {
          console.error('❌ No matching subscription found in user_subscriptions table');
          console.error('Search parameters:', { userId, planId, status });
          
          // Debug: List all subscriptions for this user
          const allSubscriptions = await UserSubscription.findAll({
            where: { userId: userId },
            attributes: ['id', 'planId', 'status', 'paymentReference', 'created_at'],
            order: [['created_at', 'DESC']]
          });
          console.error('All subscriptions for user:', allSubscriptions.map(s => ({
            id: s.id,
            planId: s.planId,
            status: s.status,
            paymentReference: s.paymentReference,
            createdAt: s.created_at
          })));
        }
      }
      
      console.log('Updated user subscription status:', { userId, status, planId, expiresAt });
    } catch (error) {
      console.error('Error updating user subscription status:', error);
      throw error;
    }
  }

  /**
   * Cancel a user's subscription
   * @param {string} userId - User ID
   * @param {string} reason - Cancellation reason
   * @returns {boolean} Success status
   */
  async cancelSubscription(userId, reason = 'User requested cancellation') {
    try {
      const subscription = await UserSubscription.findOne({
        where: {
          userId: userId,
          status: 'active'
        },
        order: [['created_at', 'DESC']]
      });

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      // Cancel the subscription
      await subscription.update({
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date(),
        autoRenew: false
      });

      // Update user's subscription status
      await this.updateUserSubscriptionStatus(userId, 'cancelled', null, null);

      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Check and update expired subscriptions
   * @returns {number} Number of subscriptions updated
   */
  async updateExpiredSubscriptions() {
    try {
      const expiredSubscriptions = await UserSubscription.findAll({
        where: {
          status: 'active',
          endDate: {
            [Op.lt]: new Date()
          }
        }
      });

      let updatedCount = 0;
      for (const subscription of expiredSubscriptions) {
        await subscription.update({ status: 'expired' });
        await this.updateUserSubscriptionStatus(
          subscription.userId, 
          'expired', 
          null, 
          null
        );
        updatedCount++;
      }

      console.log(`Updated ${updatedCount} expired subscriptions`);
      return updatedCount;
    } catch (error) {
      console.error('Error updating expired subscriptions:', error);
      throw error;
    }
  }

  /**
   * Get user's subscription analytics
   * @param {string} userId - User ID
   * @param {number} days - Number of days to analyze
   * @returns {Object} Analytics data
   */
  async getUserSubscriptionAnalytics(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get current subscription
      const currentSubscription = await UserSubscription.findOne({
        where: {
          userId: userId,
          status: 'active',
          endDate: { [Op.gt]: new Date() }
        },
        include: [{ model: SubscriptionPlan, as: 'plan' }],
        order: [['created_at', 'DESC']]
      });

      // Get usage data for the period
      const usageData = await SubscriptionUsage.findAll({
        where: {
          userId: userId,
          usagePeriod: { [Op.gte]: startDate }
        },
        order: [['usagePeriod', 'DESC']]
      });

      // Calculate totals
      const totals = {
        listings_created: 0,
        group_buys_created: 0,
        swap_deals_created: 0,
        auctions_created: 0,
        distress_sales_created: 0,
        dms_sent: 0,
        notifications_received: 0,
        ar_products_used: 0,
        promotional_boosts_used: 0
      };

      usageData.forEach(usage => {
        Object.keys(totals).forEach(key => {
          totals[key] += usage[key] || 0;
        });
      });

      // Get promotional boosts
      const boosts = await PromotionalBoost.findAll({
        where: {
          userId: userId,
          createdAt: { [Op.gte]: startDate }
        },
        order: [['createdAt', 'DESC']]
      });

      return {
        currentSubscription: currentSubscription,
        usageData: usageData,
        totals: totals,
        promotionalBoosts: boosts,
        period: {
          days: days,
          startDate: startDate,
          endDate: new Date()
        }
      };
    } catch (error) {
      console.error('Error getting subscription analytics:', error);
      throw error;
    }
  }

  /**
   * Create a promotional boost
   * @param {string} userId - User ID
   * @param {string} boostType - Type of boost
   * @param {string} targetId - ID of item to boost
   * @param {number} durationHours - Duration in hours
   * @param {string} reason - Reason for boost
   * @returns {Object} Created boost
   */
  async createPromotionalBoost(userId, boostType, targetId, durationHours = 24, reason = '') {
    try {
      // Get user's active subscription
      const subscription = await UserSubscription.findOne({
        where: {
          userId: userId,
          status: 'active',
          endDate: { [Op.gt]: new Date() }
        },
        include: [{ model: SubscriptionPlan, as: 'plan' }]
      });

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      // Check if user has remaining boosts using Redis
      const usage = await getTodayUsageFromRedis(userId);
      const usedBoosts = usage.promotionalBoostsUsed;
      
      if (usedBoosts >= subscription.plan.maxPromotionalBoosts) {
        throw new Error(`You have reached your daily promotional boost limit of ${subscription.plan.maxPromotionalBoosts}`);
      }

      // Validate target item exists and user owns it
      await this.validateTargetItem(boostType, targetId, userId);

      // Create boost
      const startTime = new Date();
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + durationHours);

      const boost = await PromotionalBoost.create({
        userId: userId,
        subscriptionId: subscription.id,
        boostType: boostType,
        targetId: targetId,
        boostDurationHours: durationHours,
        status: 'active',
        startTime: startTime,
        endTime: endTime,
        boostReason: reason
      });

      // Update usage counter in Redis
      await incrementUsageInRedis(userId, 'promotional_boosts');

      return boost;
    } catch (error) {
      console.error('Error creating promotional boost:', error);
      throw error;
    }
  }

  /**
   * Get all available subscription plans
   * @returns {Array} Available plans
   */
  async getAvailablePlans() {
    try {
      return await SubscriptionPlan.findAll({
        where: { is_active: true },
        order: [['price', 'ASC']]
      });
    } catch (error) {
      console.error('Error getting available plans:', error);
      throw error;
    }
  }

  /**
   * Get subscription plan by name
   * @param {string} planName - Plan name (drift, wave, tide, surge)
   * @returns {Object} Plan details
   */
  async getPlanByName(planName) {
    try {
      return await SubscriptionPlan.findOne({
        where: { 
          name: planName,
          isActive: true 
        }
      });
    } catch (error) {
      console.error('Error getting plan by name:', error);
      throw error;
    }
  }

  /**
   * Get subscription plan by ID
   * @param {number} planId - Plan ID
   * @returns {Object} Plan details
   */
  async getPlanById(planId) {
    try {
      return await SubscriptionPlan.findOne({
        where: { 
          id: planId,
          isActive: true 
        }
      });
    } catch (error) {
      console.error('Error getting plan by ID:', error);
      throw error;
    }
  }

  /**
   * Check if user can upgrade to a specific plan
   * @param {string} userId - User ID
   * @param {string} planName - Target plan name
   * @returns {Object} Upgrade eligibility
   */
  async checkUpgradeEligibility(userId, planName) {
    try {
      console.log('Checking upgrade eligibility for user:', userId, 'to plan:', planName);
      
      const currentSubscription = await UserSubscription.findOne({
        where: {
          userId: userId,
          status: 'active',
          endDate: { [Op.gt]: new Date() }
        },
        include: [{ model: SubscriptionPlan, as: 'plan' }],
        order: [['created_at', 'DESC']] // Get most recent subscription
      });

      console.log('Current subscription found:', currentSubscription ? {
        id: currentSubscription.id,
        userId: currentSubscription.userId,
        planId: currentSubscription.planId,
        status: currentSubscription.status,
        endDate: currentSubscription.endDate,
        planName: currentSubscription.plan?.name
      } : 'null');

      const targetPlan = await this.getPlanByName(planName);
      if (!targetPlan) {
        throw new Error('Target plan not found');
      }

      if (!currentSubscription) {
        return {
          eligible: true,
          reason: 'No active subscription',
          currentPlan: null,
          targetPlan: targetPlan
        };
      }

      const currentPlan = currentSubscription.plan;
      
      // Check if target plan is higher tier
      const planHierarchy = ['drift', 'wave', 'tide', 'surge'];
      const currentIndex = planHierarchy.indexOf(currentPlan.name);
      const targetIndex = planHierarchy.indexOf(targetPlan.name);

      if (targetIndex <= currentIndex) {
        return {
          eligible: false,
          reason: 'Target plan is not an upgrade',
          currentPlan: currentPlan,
          targetPlan: targetPlan
        };
      }

      return {
        eligible: true,
        reason: 'Eligible for upgrade',
        currentPlan: currentPlan,
        targetPlan: targetPlan
      };
    } catch (error) {
      console.error('Error checking upgrade eligibility:', error);
      throw error;
    }
  }

  /**
   * Validate that the target item exists and user owns it
   * @param {string} boostType - Type of boost (product, group_buy, etc.)
   * @param {string} targetId - ID of the target item
   * @param {string} userId - User ID
   */
  async validateTargetItem(boostType, targetId, userId) {
    try {
      const { Product, GroupBuy, SwapDeal, Auction, BuyerNeed, SellersTable } = require('../../models');
      
      let targetItem = null;
      let modelName = '';

      switch (boostType) {
        case 'product':
          targetItem = await Product.findByPk(targetId);
          modelName = 'Product';
          break;
        case 'group_buy':
          targetItem = await GroupBuy.findByPk(targetId);
          modelName = 'Group Buy';
          break;
        case 'swap_deal':
          targetItem = await SwapDeal.findByPk(targetId);
          modelName = 'Swap Deal';
          break;
        case 'auction':
          targetItem = await Auction.findByPk(targetId);
          modelName = 'Auction';
          break;
        case 'buyer_need':
          targetItem = await BuyerNeed.findByPk(targetId);
          modelName = 'Buyer Need';
          break;
        default:
          throw new Error('Invalid boost type');
      }

      if (!targetItem) {
        throw new Error(`${modelName} with ID "${targetId}" not found`);
      }

      // Check if user owns the item
      const ownerField = boostType === 'product' ? 'sellerId' : 'userId';
      let ownerId = targetItem[ownerField];
      
      // For products, we need to check if the user owns the seller account
      if (boostType === 'product') {
        const seller = await SellersTable.findOne({
          where: { id: ownerId }
        });
        
        if (!seller) {
          throw new Error(`Seller account not found for product`);
        }
        
        // Check if the seller account belongs to the current user
        if (seller.userId !== userId) {
          throw new Error(`You can only boost your own ${modelName.toLowerCase()}`);
        }
      } else {
        // For other items, check direct ownership
        if (ownerId !== userId) {
          throw new Error(`You can only boost your own ${modelName.toLowerCase()}`);
        }
      }

      console.log(`✅ Validated ${modelName} ${targetId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error validating target item:', error);
      throw error;
    }
  }

  /**
   * Reset user's usage counters when changing subscription plans
   * This prevents downgrade blocking by clearing previous usage data
   * @param {string} userId - User ID
   */
  async resetUserUsageCounters(userId) {
    try {
      // Use Redis-based reset function from middleware
      await resetUserUsageCounters(userId);
    } catch (error) {
      console.error('Error resetting usage counters:', error);
      // Don't throw error - this shouldn't block plan changes
    }
  }
}

module.exports = new SubscriptionService();
