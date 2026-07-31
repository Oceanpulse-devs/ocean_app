const { UserSubscription, SubscriptionPlan, SubscriptionUsage, PromotionalBoost, UserTable, SellersTable } = require('../../models');
const { Op } = require('sequelize');
const { resetUserUsageCounters, getTodayUsageFromRedis, incrementUsageInRedis } = require('../middleware/subscriptionMiddleware');
const promotionGatingService = require('./promotionGatingService');

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
        attributes: ['id', 'email', 'fullName', 'username'] // phoneNumber and phone don't exist in UserTable
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

      // DON'T cancel existing active subscriptions here - only cancel when new subscription becomes active
      // This prevents cancelling active subscription if user just selects a plan but doesn't complete payment
      // The cancellation will happen in updateUserSubscriptionStatus when status changes to 'active'
      console.log('Creating pending subscription. Active subscription will be cancelled only after payment is verified.');

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
        amountPaid: paymentData.amount || plan.price,  // Use passed amount, fallback to plan.price
        currency: paymentData.currency || plan.currency, // Use passed currency, fallback to plan.currency
        flutterwaveSubscriptionId: paymentData.flutterwaveSubscriptionId || null,
        nextBillingDate: paymentData.nextBillingDate || null
      });

      // DON'T update user subscription status to 'active' here
      // Only update to 'active' after payment verification succeeds
      // For pending subscriptions, keep user status as is or set to 'pending'
      console.log('Subscription created with pending status. Will activate after payment verification.');
      console.log('Payment reference:', paymentData.reference);

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
      
      // Only cancel existing subscriptions if setting to 'active'
      // For 'pending', we might have multiple pending subscriptions
      if (status === 'active' && planId) {
        console.log('Cancelling existing active subscriptions for user:', userId);
        
        await UserSubscription.update({
          status: 'cancelled',
          cancellationReason: 'Replaced by new active subscription',
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
      
      // Update users table - only for active subscriptions
      if (planId && status === 'active') {
        // Only update users table when subscription is actually active
        // For pending, we don't update the users table yet
        await UserTable.update({
          subscription_status: status,
          current_plan_id: planId,
          subscription_expires_at: expiresAt
        }, {
          where: { id: userId }
        });
        console.log('Updated users table with active subscription:', { userId, status, planId, expiresAt });
      } else if (status === 'pending') {
        // For pending subscriptions, don't update users table
        // Keep existing subscription status until payment is verified
        console.log('Subscription is pending payment. Not updating user subscription status yet.');
        return; // Exit early for pending status
      }

      // Also update user_subscriptions table if we have a planId and status is active
      if (planId && status === 'active') {
        // Find the most recent subscription for this user with this plan
        const subscription = await UserSubscription.findOne({
          where: { 
            userId: userId,
            planId: planId
          },
          order: [['created_at', 'DESC']]
        });

        if (subscription) {
          await subscription.update({
            status: 'active',
            startDate: new Date(),
            endDate: expiresAt
          });
          
          console.log('Updated user_subscriptions table for subscription:', subscription.id);
        } else {
          console.log('No matching subscription found in user_subscriptions table');
        }
      }
      
      // Update seller verification badge if plan has verified badge feature
      if (planId && status === 'active') {
        try {
          const plan = await SubscriptionPlan.findByPk(planId);
          if (plan) {
            await this.updateSellerVerificationFromSubscription(
              userId, 
              plan, 
              'grant', 
              expiresAt
            );
          }
        } catch (error) {
          // Don't fail subscription activation if verification update fails
          console.error('Error updating seller verification during subscription activation:', error);
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
          user_id: userId,
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
        cancellation_reason: reason,
        cancelled_at: new Date(),
        auto_renew: false
      });

      // Update user's subscription status
      await this.updateUserSubscriptionStatus(userId, 'cancelled', null, null);

      // Revoke verified badge if plan had verified badge feature
      try {
        const plan = await SubscriptionPlan.findByPk(subscription.planId);
        if (plan && plan.hasVerifiedBadge) {
          await this.updateSellerVerificationFromSubscription(
            userId,
            plan,
            'revoke'
          );
        }
      } catch (error) {
        // Don't fail cancellation if verification update fails
        console.error('Error revoking verified badge during cancellation:', error);
      }

      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Check and update expired subscriptions
   * Sends expiration emails and marks subscriptions as expired
   * @returns {number} Number of subscriptions updated
   */
  async updateExpiredSubscriptions() {
    try {
      const { SubscriptionPlan, UserTable } = require('../../models');
      const { sendEmail, emailTemplates } = require('./emailService');

      const expiredSubscriptions = await UserSubscription.findAll({
        where: {
          status: 'active',
          end_date: {
            [Op.lt]: new Date()
          }
        },
        include: [
          {
            model: SubscriptionPlan,
            as: 'plan',
            attributes: ['id', 'name', 'displayName', 'hasVerifiedBadge']
          },
          {
            model: UserTable,
            as: 'user',
            attributes: ['id', 'fullName', 'email', 'username']
          }
        ]
      });

      let updatedCount = 0;
      let emailsSent = 0;

      for (const subscription of expiredSubscriptions) {
        try {
          // Update subscription status
          await subscription.update({ status: 'expired' });
          await this.updateUserSubscriptionStatus(
            subscription.user_id, 
            'expired', 
            null, 
            null
          );
          updatedCount++;

          // Revoke verified badge if plan had verified badge feature
          try {
            if (subscription.plan && subscription.plan.hasVerifiedBadge) {
              await this.updateSellerVerificationFromSubscription(
                subscription.user_id,
                subscription.plan,
                'revoke'
              );
            }
          } catch (error) {
            // Don't fail expiration process if verification update fails
            console.error(`Error revoking verified badge for expired subscription ${subscription.id}:`, error);
          }

          // Send expiration email if user and plan data available
          if (subscription.user && subscription.plan) {
            try {
              const user = subscription.user;
              const plan = subscription.plan;
              const planName = plan.displayName || plan.name || 'Premium';

              console.log(`Sending expiration email to ${user.email} for ${planName} subscription`);

              const emailTemplate = emailTemplates.subscriptionExpired(
                user.fullName || user.username || 'Valued User',
                planName
              );

              await sendEmail(
                user.email,
                emailTemplate.subject,
                emailTemplate.html,
                'subscription'
              );

              emailsSent++;
              console.log(`✅ Expiration email sent to ${user.email}`);

              // Add a small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (emailError) {
              console.error(`Error sending expiration email for subscription ${subscription.id}:`, emailError);
              // Continue processing other subscriptions even if email fails
            }
          }
        } catch (error) {
          console.error(`Error updating subscription ${subscription.id}:`, error);
          // Continue processing other subscriptions
        }
      }

      console.log(`Updated ${updatedCount} expired subscriptions, sent ${emailsSent} expiration emails`);
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
          user_id: userId,
          status: 'active',
          end_date: { [Op.gt]: new Date() }
        },
        include: [{ model: SubscriptionPlan, as: 'plan' }],
        order: [['created_at', 'DESC']]
      });

      // Get usage data for the period
      const usageData = await SubscriptionUsage.findAll({
        where: {
          user_id: userId,
          usage_period: { [Op.gte]: startDate }
        },
        order: [['usage_period', 'DESC']]
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
          user_id: userId,
          created_at: { [Op.gte]: startDate }
        },
        order: [['created_at', 'DESC']]
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
      // Use promotion gating service for proper eligibility checking
      // This includes subscription check, plan restrictions, and monthly limits
      const eligibility = await promotionGatingService.checkBoostEligibility(
        userId,
        boostType,
        durationHours,
        false // isFree
      );

      if (!eligibility.eligible) {
        throw new Error(eligibility.reason || 'Not eligible for boost');
      }

      // Get subscription from eligibility result
      const subscription = eligibility.subscription;
      if (!subscription) {
        throw new Error('No active subscription found');
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

      // Increment usage counter (monthly tracking)
      await promotionGatingService.incrementPromotionUsage(userId, 'boost');

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
      const { Product, GroupBuy, SwapDeal, Auction, SellersTable } = require('../../models');
      
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
        default:
          throw new Error('Invalid boost type');
      }

      if (!targetItem) {
        throw new Error(`${modelName} with ID "${targetId}" not found`);
      }

      // Check if user owns the item
      // Products and auctions use sellerId (seller account ID) - need to check seller ownership
      // GroupBuy uses creator_id (user ID) - direct comparison
      // SwapDeal uses sellerId but it's actually a user ID - direct comparison
      
      if (boostType === 'product' || boostType === 'auction') {
        // These use sellerId (seller account ID), need to check seller ownership
        const sellerId = targetItem.sellerId;
        const seller = await SellersTable.findOne({
          where: { id: sellerId }
        });
        
        if (!seller) {
          throw new Error(`Seller account not found for ${modelName.toLowerCase()}`);
        }
        
        // Check if the seller account belongs to the current user
        if (seller.userId !== userId) {
          throw new Error(`You can only boost your own ${modelName.toLowerCase()}`);
        }
      } else if (boostType === 'group_buy') {
        // GroupBuy uses creator_id (user ID)
        const creatorId = targetItem.creator_id;
        if (creatorId !== userId) {
          throw new Error(`You can only boost your own ${modelName.toLowerCase()}`);
        }
      } else if (boostType === 'swap_deal') {
        // SwapDeal uses sellerId but it's actually a user ID (references UserTable)
        const ownerId = targetItem.sellerId;
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

  /**
   * Update seller verification status based on subscription plan
   * Only grants/revokes subscription-based verification, preserves manual verification
   * @param {string} userId - User ID
   * @param {Object} plan - Subscription plan object
   * @param {string} action - 'grant' or 'revoke'
   * @param {Date} expiresAt - When verification expires (for grant action)
   * @returns {Promise<boolean>} Success status
   */
  async updateSellerVerificationFromSubscription(userId, plan, action, expiresAt = null) {
    try {
      // Find seller by userId
      const seller = await SellersTable.findOne({
        where: { userId }
      });
      
      if (!seller) {
        console.log(`⚠️ Seller not found for user ${userId}, skipping verification update`);
        return false;
      }
      
      // Check if plan has verified badge feature
      const hasVerifiedBadge = plan.hasVerifiedBadge === true || plan.has_verified_badge === true;
      
      if (!hasVerifiedBadge) {
        // Plan doesn't have verified badge, nothing to do
        return true;
      }
      
      if (action === 'grant') {
        // Only grant if seller doesn't already have manual verification
        // Check if verification was manually approved (not subscription-based)
        const isManualVerification = seller.verificationStatus === 'approved' && 
                                      seller.verificationNotes && 
                                      !seller.verificationNotes.includes('Subscription-based verification');
        
        if (isManualVerification) {
          console.log(`ℹ️ Seller ${seller.id} has manual verification, preserving it`);
          return true; // Don't override manual verification
        }
        
        // Determine verification level based on plan
        let verificationLevel = 'premium'; // Default for Tide
        if (plan.name === 'surge' || plan.name === 'Surge') {
          verificationLevel = 'enterprise';
        }
        
        // Update seller verification
        await seller.update({
          isVerified: true,
          verificationStatus: 'approved',
          verifiedAt: new Date(),
          verificationExpiresAt: expiresAt,
          verificationLevel: verificationLevel,
          verificationNotes: `Subscription-based verification from ${plan.displayName || plan.name} plan`,
          lastVerificationCheck: new Date()
        });
        
        // Add verified badge to benefits if not already present
        const benefits = seller.verifiedSellerBenefits || [];
        if (!benefits.includes('Verified Seller Badge')) {
          benefits.push('Verified Seller Badge');
          await seller.update({
            verifiedSellerBenefits: benefits
          });
        }
        
        console.log(`✅ Granted verified badge to seller ${seller.id} for ${plan.name} subscription`);
        return true;
        
      } else if (action === 'revoke') {
        // Only revoke if verification was subscription-based
        const isSubscriptionBased = seller.verificationNotes && 
                                     seller.verificationNotes.includes('Subscription-based verification');
        
        if (!isSubscriptionBased) {
          console.log(`ℹ️ Seller ${seller.id} has manual verification, not revoking`);
          return true; // Don't revoke manual verification
        }
        
        // Revoke subscription-based verification
        await seller.update({
          isVerified: false,
          verificationStatus: 'expired',
          verificationExpiresAt: null,
          verificationNotes: seller.verificationNotes ? 
            seller.verificationNotes.replace('Subscription-based verification', 'Subscription expired') : 
            'Subscription expired',
          lastVerificationCheck: new Date()
        });
        
        // Remove verified badge from benefits
        const benefits = seller.verifiedSellerBenefits || [];
        const updatedBenefits = benefits.filter(b => b !== 'Verified Seller Badge');
        await seller.update({
          verifiedSellerBenefits: updatedBenefits
        });
        
        console.log(`✅ Revoked verified badge from seller ${seller.id} (subscription expired/cancelled)`);
        return true;
      }
      
      return false;
    } catch (error) {
      // Log error but don't throw - we don't want verification issues to break subscriptions
      console.error(`❌ Error updating seller verification for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if user is eligible for free trial
   * @param {string} userId - User ID
   * @param {string} planName - Plan name to trial
   * @returns {Object} {eligible: boolean, reason: string}
   */
  async checkTrialEligibility(userId, planName) {
    try {
      console.log('Checking trial eligibility - Free trials decommissioned');
      return {
        eligible: false,
        reason: 'Free trials are no longer available. Please select a plan to subscribe.'
      };
    } catch (error) {
      console.error('Error checking trial eligibility:', error);
      throw error;
    }
  }

  /**
   * Create trial subscription (no payment required)
   * @param {string} userId - User ID
   * @param {string} planName - Plan name
   * @returns {Object} Created trial subscription
   */
  async createTrialSubscription(userId, planName) {
    throw new Error('Free trials are no longer available. Please select a plan to subscribe.');
  }
}

module.exports = new SubscriptionService();
