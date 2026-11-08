const { UserSubscription, SubscriptionPlan, PromotionUsage } = require('../../models');
const { Op } = require('sequelize');
const { isSubscriptionEnabled } = require('../config/subscriptionConfig');

/**
 * Promotion Gating Service
 * 
 * Handles all subscription plan gating logic for promotions:
 * - Boost eligibility and limits
 * - Top placement eligibility
 * - Spotlight eligibility
 * - Cost calculations
 * - Monthly usage tracking
 */
class PromotionGatingService {

  /**
   * Get user's active subscription with plan details
   * @param {string} userId - User ID
   * @returns {Object|null} Subscription with plan details
   */
  async getUserSubscription(userId) {
    try {
      if (!isSubscriptionEnabled()) {
        return null;
      }

      const subscription = await UserSubscription.findOne({
        where: {
          userId: userId,
          status: 'active',
          endDate: { [Op.gt]: new Date() }
        },
        include: [{
          model: SubscriptionPlan,
          as: 'plan',
          required: false // LEFT JOIN - return subscription even if plan is missing
        }],
        order: [['created_at', 'DESC']]
      });

      // Log warning if plan is missing
      if (subscription && !subscription.plan) {
        console.error(`⚠️ Subscription ${subscription.id} for user ${userId} has invalid plan_id: ${subscription.planId}`);
      }

      return subscription;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }

  /**
   * Get or create promotion usage record for current month
   * @param {string} userId - User ID
   * @param {number} subscriptionId - Subscription ID
   * @returns {Object} Promotion usage record
   */
  async getOrCreatePromotionUsage(userId, subscriptionId) {
    try {
      const now = new Date();
      // Format as DATEONLY string (YYYY-MM-DD) - first day of current month
      const usagePeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      // Use camelCase for Sequelize model attributes
      let usage = await PromotionUsage.findOne({
        where: {
          userId: userId,
          usagePeriod: usagePeriod
        }
      });

      if (!usage) {
        // Create new usage record
        usage = await PromotionUsage.create({
          userId: userId,
          subscriptionId: subscriptionId,
          usagePeriod: usagePeriod,
          boostsUsed: 0,
          topPlacementsUsed: 0,
          spotlightsUsed: 0
        });
      } else if (usage.subscriptionId !== subscriptionId) {
        // User changed subscriptions mid-month - reset counters and update subscriptionId
        console.log(`⚠️ User ${userId} changed subscriptions mid-month. Resetting promotion usage counters.`);
        await usage.update({
          subscriptionId: subscriptionId,
          boostsUsed: 0,
          topPlacementsUsed: 0,
          spotlightsUsed: 0
        });
        // Reload to get updated values
        await usage.reload();
      }

      return usage;
    } catch (error) {
      console.error('Error getting/creating promotion usage:', error);
      throw error;
    }
  }

  /**
   * Check if user can create a boost
   * @param {string} userId - User ID
   * @param {string} boostType - Type of boost
   * @param {number} durationHours - Duration in hours
   * @param {boolean} isFree - Whether this is a free boost
   * @returns {Object} Eligibility result
   */
  async checkBoostEligibility(userId, boostType, durationHours = 24, isFree = false) {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        return {
          eligible: false,
          reason: 'No active subscription found',
          canUpgrade: true
        };
      }

      const plan = subscription.plan;

      // Add null check for plan
      if (!plan) {
        console.error(`⚠️ Subscription ${subscription.id} has no associated plan (plan_id: ${subscription.planId})`);
        return {
          eligible: false,
          reason: 'Your subscription plan could not be found. Please contact support.',
          canUpgrade: false
        };
      }

      // DRIFT plan: No boosts allowed
      if (plan.name === 'drift') {
        return {
          eligible: false,
          reason: 'Boosts are not available on the Drift plan. Please upgrade to Wave or higher.',
          canUpgrade: true,
          currentPlan: plan.name
        };
      }

      // Get monthly usage
      const usage = await this.getOrCreatePromotionUsage(userId, subscription.id);
      let monthlyLimit = plan.max_promotional_boosts;

      // Validate monthlyLimit - if null/undefined/0, use plan-name-based logic
      if (monthlyLimit == null || monthlyLimit === 0) {
        // Calculate limit based on plan name (fallback if DB value is missing/invalid)
        if (plan.has_unlimited_features || plan.name === 'surge') {
          monthlyLimit = -1; // Unlimited for surge plan
        } else if (plan.name === 'tide') {
          monthlyLimit = 3; // TIDE: 3 boosts/month
        } else if (plan.name === 'wave') {
          monthlyLimit = 1; // WAVE: 1 boost/month
        } else {
          monthlyLimit = 0; // DRIFT: No boosts
        }
        
        // Log warning if DB value was missing
        if (plan.max_promotional_boosts == null || plan.max_promotional_boosts === 0) {
          console.warn(`⚠️ Plan ${plan.name} has invalid max_promotional_boosts (${plan.max_promotional_boosts}). Using fallback: ${monthlyLimit}`);
        }
      }

      // Check monthly limit (-1 means unlimited)
      if (monthlyLimit !== -1 && usage.boostsUsed >= monthlyLimit) {
        return {
          eligible: false,
          reason: `You have reached your monthly boost limit of ${monthlyLimit}. Upgrade to Surge for unlimited boosts.`,
          canUpgrade: plan.name !== 'surge',
          currentPlan: plan.name,
          used: usage.boostsUsed,
          limit: monthlyLimit
        };
      }

      // Validate duration based on plan
      const durationValidation = this.validateBoostDuration(plan.name, durationHours);
      if (!durationValidation.valid) {
        return {
          eligible: false,
          reason: durationValidation.reason,
          canUpgrade: durationValidation.canUpgrade,
          currentPlan: plan.name
        };
      }

      return {
        eligible: true,
        reason: 'Eligible to create boost',
        currentPlan: plan.name,
        monthlyLimit: monthlyLimit,
        used: usage.boostsUsed,
        remaining: monthlyLimit === -1 ? -1 : monthlyLimit - usage.boostsUsed,
        subscription: subscription
      };
    } catch (error) {
      console.error('Error checking boost eligibility:', error);
      return {
        eligible: false,
        reason: 'Error checking eligibility: ' + error.message
      };
    }
  }

  /**
   * Validate boost duration based on plan
   * @param {string} planName - Plan name
   * @param {number} durationHours - Duration in hours
   * @returns {Object} Validation result
   */
  validateBoostDuration(planName, durationHours) {
    // WAVE: Only 24 hours
    if (planName === 'wave') {
      if (durationHours !== 24) {
        return {
          valid: false,
          reason: 'Wave plan only supports 24-hour boosts. Upgrade to Tide for longer durations.',
          canUpgrade: true
        };
      }
    }

    // TIDE and SURGE: 1-7 days (24-168 hours)
    if (planName === 'tide' || planName === 'surge') {
      if (durationHours < 24 || durationHours > 168) {
        return {
          valid: false,
          reason: 'Duration must be between 24 hours (1 day) and 168 hours (7 days)',
          canUpgrade: false
        };
      }
    }

    return { valid: true };
  }

  /**
   * Check if user can enable auto-reboost
   * @param {string} userId - User ID
   * @returns {Object} Eligibility result
   */
  async checkAutoReboostEligibility(userId) {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        return {
          eligible: false,
          reason: 'No active subscription found'
        };
      }

      const plan = subscription.plan;

      // Add null check for plan
      if (!plan) {
        console.error(`⚠️ Subscription ${subscription.id} has no associated plan (plan_id: ${subscription.planId})`);
        return {
          eligible: false,
          reason: 'Your subscription plan could not be found. Please contact support.',
          canUpgrade: false
        };
      }

      if (!plan.can_auto_reboost) {
        return {
          eligible: false,
          reason: `Auto-reboost is not available on the ${plan.display_name || plan.name} plan. Upgrade to Tide or Surge.`,
          canUpgrade: true,
          currentPlan: plan.name
        };
      }

      return {
        eligible: true,
        reason: 'Auto-reboost is available',
        currentPlan: plan.name
      };
    } catch (error) {
      console.error('Error checking auto-reboost eligibility:', error);
      return {
        eligible: false,
        reason: 'Error checking eligibility: ' + error.message
      };
    }
  }

  /**
   * Check if user can use location targeting
   * @param {string} userId - User ID
   * @returns {Object} Eligibility result
   */
  async checkLocationTargetingEligibility(userId) {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        return {
          eligible: false,
          reason: 'No active subscription found'
        };
      }

      const plan = subscription.plan;

      // Add null check for plan
      if (!plan) {
        console.error(`⚠️ Subscription ${subscription.id} has no associated plan (plan_id: ${subscription.planId})`);
        return {
          eligible: false,
          reason: 'Your subscription plan could not be found. Please contact support.',
          canUpgrade: false
        };
      }

      if (!plan.can_location_target) {
        return {
          eligible: false,
          reason: `Location targeting is not available on the ${plan.display_name || plan.name} plan. Upgrade to Tide or Surge.`,
          canUpgrade: true,
          currentPlan: plan.name
        };
      }

      return {
        eligible: true,
        reason: 'Location targeting is available',
        currentPlan: plan.name
      };
    } catch (error) {
      console.error('Error checking location targeting eligibility:', error);
      return {
        eligible: false,
        reason: 'Error checking eligibility: ' + error.message
      };
    }
  }

  /**
   * Calculate boost cost based on plan and duration
   * @param {string} userId - User ID
   * @param {number} durationHours - Duration in hours
   * @param {boolean} isFree - Whether this is a free boost
   * @returns {Object} Cost information
   */
  async calculateBoostCost(userId, durationHours = 24, isFree = false) {
    try {
      if (isFree) {
        return {
          cost: 0,
          currency: 'NGN',
          isFree: true,
          reason: 'Free boost from monthly allowance'
        };
      }

      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      const plan = subscription.plan;

      // Add null check for plan
      if (!plan) {
        throw new Error('Your subscription plan could not be found. Please contact support.');
      }

      // Base pricing (can be customized)
      const basePricePerDay = 500; // NGN per day
      const days = durationHours / 24;
      const baseCost = basePricePerDay * days;

      // Plan-based discounts
      let discount = 0;
      if (plan.name === 'tide') {
        discount = 0.1; // 10% discount
      } else if (plan.name === 'surge') {
        discount = 0.2; // 20% discount
      }

      const finalCost = Math.round(baseCost * (1 - discount));

      return {
        cost: finalCost,
        currency: 'NGN',
        isFree: false,
        baseCost: baseCost,
        discount: discount,
        plan: plan.name
      };
    } catch (error) {
      console.error('Error calculating boost cost:', error);
      throw error;
    }
  }

  /**
   * Get available boosts for user (based on plan)
   * @param {string} userId - User ID
   * @returns {Object} Available boosts information
   */
  async getAvailableBoosts(userId) {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        return {
          available: false,
          reason: 'No active subscription found',
          canUpgrade: true
        };
      }

      const plan = subscription.plan;

      // Add null check for plan
      if (!plan) {
        console.error(`⚠️ Subscription ${subscription.id} has no associated plan (plan_id: ${subscription.planId})`);
        return {
          available: false,
          reason: 'Your subscription plan could not be found. Please contact support.',
          canUpgrade: false
        };
      }

      const usage = await this.getOrCreatePromotionUsage(userId, subscription.id);

      let monthlyLimit = plan.max_promotional_boosts;

      // Validate monthlyLimit - if null/undefined/0, use plan-name-based logic
      if (monthlyLimit == null || monthlyLimit === 0) {
        if (plan.has_unlimited_features || plan.name === 'surge') {
          monthlyLimit = -1; // Unlimited for surge plan
        } else if (plan.name === 'tide') {
          monthlyLimit = 3; // TIDE: 3 boosts/month
        } else if (plan.name === 'wave') {
          monthlyLimit = 1; // WAVE: 1 boost/month
        } else {
          monthlyLimit = 0; // DRIFT: No boosts
        }
      }

      const used = usage.boostsUsed;
      const remaining = monthlyLimit === -1 ? -1 : monthlyLimit - used;

      return {
        available: plan.name !== 'drift',
        currentPlan: plan.name,
        monthlyLimit: monthlyLimit,
        used: used,
        remaining: remaining,
        canAutoReboost: plan.can_auto_reboost,
        canLocationTarget: plan.can_location_target,
        durationOptions: this.getDurationOptions(plan.name),
        boostMultiplier: plan.boost_multiplier
      };
    } catch (error) {
      console.error('Error getting available boosts:', error);
      return {
        available: false,
        reason: 'Error getting available boosts: ' + error.message
      };
    }
  }

  /**
   * Get duration options based on plan
   * @param {string} planName - Plan name
   * @returns {Array} Available duration options
   */
  getDurationOptions(planName) {
    if (planName === 'wave') {
      return [{ hours: 24, label: '1 Day', package: '1-day' }];
    }

    if (planName === 'tide' || planName === 'surge') {
      return [
        { hours: 24, label: '1 Day', package: '1-day' },
        { hours: 72, label: '3 Days', package: '3-day' },
        { hours: 168, label: '7 Days', package: '7-day' }
      ];
    }

    return [];
  }

  /**
   * Check top placement eligibility
   * @param {string} userId - User ID
   * @param {string} itemType - Type of item
   * @param {number} durationDays - Duration in days
   * @returns {Object} Eligibility result
   */
  async checkTopPlacementEligibility(userId, itemType, durationDays = 7) {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        return {
          eligible: false,
          reason: 'No active subscription found'
        };
      }

      const plan = subscription.plan;

      // Add null check for plan
      if (!plan) {
        console.error(`⚠️ Subscription ${subscription.id} has no associated plan (plan_id: ${subscription.planId})`);
        return {
          eligible: false,
          reason: 'Your subscription plan could not be found. Please contact support.',
          canUpgrade: false
        };
      }

      // DRIFT and WAVE: No top placement
      if (plan.name === 'drift' || plan.name === 'wave') {
        return {
          eligible: false,
          reason: `Top placement is not available on the ${plan.display_name || plan.name} plan. Upgrade to Tide or Surge.`,
          canUpgrade: true,
          currentPlan: plan.name
        };
      }

      // Get monthly usage
      const usage = await this.getOrCreatePromotionUsage(userId, subscription.id);
      
      // Calculate limit based on plan name (since max_top_placements column doesn't exist in DB)
      const monthlyLimit = (plan.has_unlimited_features || plan.name === 'surge')
        ? -1  // Unlimited for surge plan
        : plan.name === 'tide'
          ? 1  // TIDE: 1 top placement/month
          : 0; // DRIFT/WAVE: Not available

      // Check monthly limit (-1 means unlimited)
      if (monthlyLimit !== -1 && usage.topPlacementsUsed >= monthlyLimit) {
        return {
          eligible: false,
          reason: `You have reached your monthly top placement limit of ${monthlyLimit}. Upgrade to Surge for unlimited.`,
          canUpgrade: plan.name !== 'surge',
          currentPlan: plan.name,
          used: usage.topPlacementsUsed,
          limit: monthlyLimit
        };
      }

      // Validate duration (TIDE: 7 days only, SURGE: 3/7/14 days)
      if (plan.name === 'tide' && durationDays !== 7) {
        return {
          eligible: false,
          reason: 'Tide plan only supports 7-day top placements. Upgrade to Surge for more options.',
          canUpgrade: true,
          currentPlan: plan.name
        };
      }

      if (plan.name === 'surge' && ![3, 7, 14].includes(durationDays)) {
        return {
          eligible: false,
          reason: 'Surge plan supports 3, 7, or 14-day top placements only.',
          canUpgrade: false,
          currentPlan: plan.name
        };
      }

      return {
        eligible: true,
        reason: 'Eligible for top placement',
        currentPlan: plan.name,
        monthlyLimit: monthlyLimit,
        used: usage.topPlacementsUsed,
        remaining: monthlyLimit === -1 ? -1 : monthlyLimit - usage.topPlacementsUsed
      };
    } catch (error) {
      console.error('Error checking top placement eligibility:', error);
      return {
        eligible: false,
        reason: 'Error checking eligibility: ' + error.message
      };
    }
  }

  /**
   * Check spotlight eligibility
   * @param {string} userId - User ID
   * @param {string} slotType - Type of spotlight slot
   * @param {number} durationDays - Duration in days
   * @returns {Object} Eligibility result
   */
  async checkSpotlightEligibility(userId, slotType, durationDays = 7) {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        return {
          eligible: false,
          reason: 'No active subscription found'
        };
      }

      const plan = subscription.plan;

      // Add null check for plan
      if (!plan) {
        console.error(`⚠️ Subscription ${subscription.id} has no associated plan (plan_id: ${subscription.planId})`);
        return {
          eligible: false,
          reason: 'Your subscription plan could not be found. Please contact support.',
          canUpgrade: false
        };
      }

      // DRIFT and WAVE: No spotlight
      if (plan.name === 'drift' || plan.name === 'wave') {
        return {
          eligible: false,
          reason: `Spotlight is not available on the ${plan.display_name || plan.name} plan. Upgrade to Tide or Surge.`,
          canUpgrade: true,
          currentPlan: plan.name
        };
      }

      // Get monthly usage
      const usage = await this.getOrCreatePromotionUsage(userId, subscription.id);
      
      // Calculate limit based on plan name (since max_spotlights column doesn't exist in DB)
      const monthlyLimit = (plan.has_unlimited_features || plan.name === 'surge')
        ? -1  // Unlimited for surge plan
        : plan.name === 'tide'
          ? 1  // TIDE: 1 spotlight/month
          : 0; // DRIFT/WAVE: Not available

      // Check monthly limit (-1 means unlimited)
      if (monthlyLimit !== -1 && usage.spotlightsUsed >= monthlyLimit) {
        return {
          eligible: false,
          reason: `You have reached your monthly spotlight limit of ${monthlyLimit}. Upgrade to Surge for unlimited.`,
          canUpgrade: plan.name !== 'surge',
          currentPlan: plan.name,
          used: usage.spotlightsUsed,
          limit: monthlyLimit
        };
      }

      return {
        eligible: true,
        reason: 'Eligible for spotlight',
        currentPlan: plan.name,
        monthlyLimit: monthlyLimit,
        used: usage.spotlightsUsed,
        remaining: monthlyLimit === -1 ? -1 : monthlyLimit - usage.spotlightsUsed
      };
    } catch (error) {
      console.error('Error checking spotlight eligibility:', error);
      return {
        eligible: false,
        reason: 'Error checking eligibility: ' + error.message
      };
    }
  }

  /**
   * Increment promotion usage counter
   * @param {string} userId - User ID
   * @param {string} promotionType - Type of promotion (boost, top_placement, spotlight)
   * @returns {boolean} Success status
   */
  async incrementPromotionUsage(userId, promotionType) {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      const usage = await this.getOrCreatePromotionUsage(userId, subscription.id);

      // Use camelCase for Sequelize model attributes
      const fieldMap = {
        'boost': 'boostsUsed',
        'top_placement': 'topPlacementsUsed',
        'spotlight': 'spotlightsUsed'
      };

      const field = fieldMap[promotionType];
      if (!field) {
        throw new Error(`Invalid promotion type: ${promotionType}`);
      }

      await usage.increment(field);

      return true;
    } catch (error) {
      console.error('Error incrementing promotion usage:', error);
      throw error;
    }
  }

  /**
   * Get subscription plan features for user
   * @param {string} userId - User ID
   * @returns {Object} Plan features
   */
  async getSubscriptionPlanFeatures(userId) {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        return {
          hasSubscription: false,
          message: 'No active subscription found'
        };
      }

      const plan = subscription.plan;

      // Add null check for plan
      if (!plan) {
        console.error(`⚠️ Subscription ${subscription.id} has no associated plan (plan_id: ${subscription.planId})`);
        return {
          hasSubscription: false,
          message: 'Your subscription plan could not be found. Please contact support.'
        };
      }

      const usage = await this.getOrCreatePromotionUsage(userId, subscription.id);

      // Calculate boost limit with fallback
      let boostsLimit = plan.max_promotional_boosts;
      if (boostsLimit == null || boostsLimit === 0) {
        if (plan.has_unlimited_features || plan.name === 'surge') {
          boostsLimit = -1; // Unlimited for surge plan
        } else if (plan.name === 'tide') {
          boostsLimit = 3; // TIDE: 3 boosts/month
        } else if (plan.name === 'wave') {
          boostsLimit = 1; // WAVE: 1 boost/month
        } else {
          boostsLimit = 0; // DRIFT: No boosts
        }
      }

      // Calculate limits based on plan name (since max_top_placements and max_spotlights columns don't exist in DB)
      const topPlacementsLimit = (plan.has_unlimited_features || plan.name === 'surge')
        ? -1  // Unlimited for surge plan
        : plan.name === 'tide'
          ? 1  // TIDE: 1 top placement/month
          : 0; // DRIFT/WAVE: Not available

      const spotlightsLimit = (plan.has_unlimited_features || plan.name === 'surge')
        ? -1  // Unlimited for surge plan
        : plan.name === 'tide'
          ? 1  // TIDE: 1 spotlight/month
          : 0; // DRIFT/WAVE: Not available

      return {
        hasSubscription: true,
        plan: {
          name: plan.name,
          displayName: plan.display_name,
          price: plan.price,
          currency: plan.currency
        },
        boosts: {
          monthlyLimit: boostsLimit, // Use calculated limit instead of plan.max_promotional_boosts
          used: usage.boostsUsed,
          remaining: boostsLimit === -1 ? -1 : boostsLimit - usage.boostsUsed,
          canAutoReboost: plan.can_auto_reboost,
          canLocationTarget: plan.can_location_target,
          multiplier: plan.boost_multiplier,
          durationOptions: this.getDurationOptions(plan.name)
        },
        topPlacements: {
          monthlyLimit: topPlacementsLimit,
          used: usage.topPlacementsUsed,
          remaining: topPlacementsLimit === -1 ? -1 : topPlacementsLimit - usage.topPlacementsUsed
        },
        spotlights: {
          monthlyLimit: spotlightsLimit,
          used: usage.spotlightsUsed,
          remaining: spotlightsLimit === -1 ? -1 : spotlightsLimit - usage.spotlightsUsed
        }
      };
    } catch (error) {
      console.error('Error getting subscription plan features:', error);
      return {
        hasSubscription: false,
        message: 'Error getting plan features: ' + error.message
      };
    }
  }
}

module.exports = new PromotionGatingService();

